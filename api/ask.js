export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, model, imageUrl } = req.body;
    
    // ✅ เพิ่มการตรวจสอบนี้เพื่อดูข้อมูลที่รับมา
    console.log("=== ข้อมูลที่รับมา ===");
    console.log("Message:", message);
    console.log("Model:", model);
    console.log("Has Image:", !!imageUrl);
    console.log("=====================");

    if (!message && !imageUrl) {
      return res.status(400).json({ error: "ต้องมีข้อความหรือรูปภาพอย่างน้อย 1 อย่าง" });
    }

    // ✅ ตรวจสอบว่า model มีค่าหรือไม่
    if (!model) {
      return res.status(400).json({ error: "ไม่พบชื่อโมเดล กรุณาเลือกโมเดล" });
    }

    const isVisionModel = model === "qwen-vl-max-2025-04-08" && imageUrl;

    const messages = isVisionModel
      ? [{
          role: "user",
          content: [
            { 
              image: imageUrl.replace(/^data:image\/\w+;base64,/, '') 
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

    const response = await fetch(
      "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.DASHSCOPE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          input: { messages: messages }
        }),
      }
    );

    const data = await response.json();

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
