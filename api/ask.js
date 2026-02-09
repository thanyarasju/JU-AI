export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, model, imageUrl } = req.body;
    
    // ตรวจสอบข้อมูล
    if (!message && !imageUrl) {
      return res.status(400).json({ error: "ต้องมีข้อความหรือรูปภาพอย่างน้อย 1 อย่าง" });
    }

    // สร้างข้อความในรูปแบบ OpenAI-Compatible
    let messages = [];
    
    // ✅ กรณี 1: ใช้ Vision Model + มีรูปภาพ
    if (model === "qwen-vl-max-2025-04-08" && imageUrl) {
      messages = [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl // ส่งรูปแบบเต็มได้เลย (ไม่ต้องตัดส่วนนำหน้า)
              }
            },
            {
              type: "text",
              text: message || "อธิบายรูปภาพนี้"
            }
          ]
        }
      ];
    } 
    // ✅ กรณี 2: ใช้ Text Model (Qwen Max) หรือไม่มีรูปภาพ
    else {
      messages = [
        {
          role: "user",
          content: message || "สวัสดี"
        }
      ];
    }

    // ✅ ใช้ OpenAI-Compatible Endpoint (รองรับทั้ง 2 โมเดล!)
    const response = await fetch(
      "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", // ⚠️ ไม่มีช่องว่างท้าย!
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.DASHSCOPE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model, // ส่งชื่อโมเดลที่ผู้ใช้เลือก (ทั้ง qwen3-max และ qwen-vl-max)
          messages: messages,
          max_tokens: 2000
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("API Error:", data);
      return res.status(response.status).json({ 
        error: `API Error: ${data.error?.message || data.message || "Unknown error"}`,
        code: data.error?.code || data.code,
        details: data
      });
    }

    const answer = data?.choices?.[0]?.message?.content || "ไม่มีคำตอบจาก AI";
    return res.status(200).json({ answer });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์: " + err.message });
  }
}
