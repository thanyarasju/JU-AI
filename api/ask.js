export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ รับค่าทั้งหมดที่ส่งมาจากหน้าเว็บ
    const { message, model, imageUrl } = req.body;
    
    // ✅ ตรวจสอบว่ามีข้อมูลหรือไม่
    if (!message && !imageUrl) {
      return res.status(400).json({ error: "ต้องมีข้อความหรือรูปภาพอย่างน้อย 1 อย่าง" });
    }

    // ✅ ตรวจสอบว่าเป็น Vision Model หรือไม่
    const isVisionModel = model === "qwen-vl-max-2025-04-08" && imageUrl;

    // ✅ สร้างโครงสร้างข้อมูลแบบอัตโนมัติ
    const messages = isVisionModel
      ? [{
          role: "user",
          content: [
            { 
              image: imageUrl.replace(/^data:image\/\w+;base64,/, '') // ตัดส่วนนำหน้าออก
            },
            { 
              text: message || "What's in this image?" 
            }
          ]
        }]
      : [{
          role: "user",
          content: message || "Hello"
        }];

    // ✅ ส่งไปยัง API (URL ไม่มีช่องว่างท้าย!)
    const response = await fetch(
      "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation", // ⚠️ ลบช่องว่าง 4 ช่องออก!
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.DASHSCOPE_API_KEY}`, // ใช้ Key เดียว!
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model, // ✅ ใช้โมเดลที่ผู้ใช้เลือก (ไม่บังคับ!)
          input: { messages: messages }
        }),
      }
    );

    const data = await response.json();

    // ✅ ตรวจสอบข้อผิดพลาด
    if (!response.ok) {
      console.error("API Error:", data);
      return res.status(400).json({ 
        error: `API Error: ${data.message || "Unknown error"}`,
        code: data.code,
        details: data
      });
    }

    const answer = data?.output?.choices?.[0]?.message?.content || "ไม่มีคำตอบจาก AI";
    return res.status(200).json({ answer });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์: " + err.message });
  }
}
