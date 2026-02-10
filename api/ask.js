export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, model, imageUrl } = req.body;

    // ✅ แก้ไข 1: ลบช่องว่างท้ายออกให้หมด!
    const endpoint = "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

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

    let messages;

    // ✅ แก้ไข 2: ใช้โครงสร้าง image_url แบบถูกต้อง + ส่ง Data URL แบบเต็ม (ไม่ตัดอะไรออก!)
    if (model.includes("vl") && imageUrl) {
      messages = [{
        role: "user",
        content: [
          { 
            image_url: { 
              url: imageUrl // ✅ ส่งแบบเต็ม เช่น "data:image/png;base64,iVBORw0KG..."
            } 
          },
          { 
            text: message || "อธิบายรูปนี้หน่อย" 
          }
        ]
      }];
    } else {
      // กรณีไม่มีรูป หรือใช้โมเดลข้อความล้วน
      messages = [{
        role: "user",
        content: message || "สวัสดี"
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
      return res.status(response.status).json({
        error: data.message || "เกิดข้อผิดพลาด",
        code: data.code
      });
    }

    const answer = data?.output?.choices?.[0]?.message?.content || "ไม่มีคำตอบ";
    return res.status(200).json({ answer });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({
      error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
    });
  }
}
