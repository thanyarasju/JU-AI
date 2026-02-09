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

    // ✅ ใช้ endpoint เดียวสำหรับทั้ง 2 โมเดล (ไม่มีช่องว่างท้าย!)
    const endpoint = "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

    // ✅ สร้างโครงสร้างข้อมูลให้ถูกต้อง
    let messages;

    // กรณี Vision Model + มีรูปภาพ
    if (model === "qwen-vl-max-2025-04-08" && imageUrl) {
      // ⚠️ ต้องตัดส่วนนำหน้า base64 ออกสำหรับ Native API
      const cleanImage = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      
      messages = [{
        role: "user",
        content: [
          { image: cleanImage }, // ✅ ส่งแค่ส่วน base64 ล้วน
          { text: message || "Describe this image" }
        ]
      }];
    } 
    // กรณี Text Model หรือไม่มีรูปภาพ
    else {
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
        model: model, // ส่งชื่อโมเดลที่ผู้ใช้เลือก (ทั้ง qwen3-max และ qwen-vl-max)
        input: { messages }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API Error:", data);
      return res.status(response.status).json({
        error: data.message || "Unknown API error",
        code: data.code,
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
