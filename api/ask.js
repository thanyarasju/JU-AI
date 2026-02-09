export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, model, imageUrl } = req.body;

    console.log("=== Incoming Request ===");
    console.log("Message:", message);
    console.log("Model:", model);
    console.log("Has Image:", !!imageUrl);
    console.log("========================");

    if (!message && !imageUrl) {
      return res.status(400).json({
        error: "ต้องมีข้อความหรือรูปภาพอย่างน้อย 1 อย่าง"
      });
    }

    if (!model) {
      return res.status(400).json({
        error: "ไม่พบชื่อโมเดล กรุณาเลือกโมเดล"
      });
    }

    // ✅ ตรวจว่าเป็น Vision model ไหม
    const isVisionModel = model === "qwen-vl-max-2025-04-08";

    // ✅ เลือก endpoint ตามประเภทโมเดล
    const endpoint = isVisionModel
      ? "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
      : "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

    // ✅ สร้าง messages ให้ถูก format
    let messages;

    if (isVisionModel) {
      messages = [{
        role: "user",
        content: [
          ...(imageUrl ? [{ image: imageUrl }] : []),
          { text: message || "Describe this image" }
        ]
      }];
    } else {
      messages = [{
        role: "user",
        content: message || "Hello"
      }];
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        input: { messages }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API Error:", data);
      return res.status(400).json({
        error: data.message || "Unknown API error",
        details: data
      });
    }

    const answer =
      data?.output?.choices?.[0]?.message?.content ||
      "ไม่มีคำตอบจาก AI";

    return res.status(200).json({ answer });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({
      error: "Server error: " + err.message
    });
  }
}
