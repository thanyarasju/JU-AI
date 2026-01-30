export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, model, imageUrl } = req.body; // เพิ่มรับ imageUrl

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // เลือกโมเดล: ถ้าไม่ส่งมาให้ใช้ qwen3-max เป็นค่าเริ่มต้น
    const selectedModel = model || "qwen3-max-2026-01-23";

    // สร้างโครงสร้างข้อความ
    let messages = [];

    // เพิ่ม system message (เฉพาะเมื่อไม่มีรูปภาพ)
    if (!imageUrl) {
      messages.push({
        role: "system",
        content: `
You are Qwen, an open-source large language model.
Respond in a natural, conversational, and helpful tone, similar to Qwen Chat.
Explain step by step when appropriate.
Avoid overly formal language.
Do not overuse bullet points.
Keep answers clear, warm, and easy to read.
`
      });
    }

    // สร้างข้อความผู้ใช้
    if (imageUrl && selectedModel.includes('vl')) {
      // มีรูปภาพ → ใช้โครงสร้างพิเศษสำหรับ Qwen-VL
      messages.push({
        role: "user",
        content: [
          { text: message || "Describe this image." },
          { image_url: { url: imageUrl } }
        ]
      });
    } else {
      // ไม่มีรูปภาพ → ใช้โครงสร้างปกติ
      messages.push({
        role: "user",
        content: message
      });
    }

    // ใช้ endpoint ที่ถูกต้อง (ไม่มี -intl และไม่มีช่องว่าง)
    const response = await fetch(
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.DASHSCOPE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          input: { messages }
        }),
      }
    );

    // ตรวจสอบ error จาก API
    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      return res.status(response.status).json({
        error: "API request failed",
        details: errorData
      });
    }

    const data = await response.json();
    const answer = data?.output?.choices?.[0]?.message?.content || "No response from Qwen";

    return res.status(200).json({ answer, model: selectedModel });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ 
      error: "Internal server error",
      details: err.message 
    });
  }
}
