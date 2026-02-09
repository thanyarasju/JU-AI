// pages/api/ask.js หรือ app/api/ask/route.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, model, imageUrl } = req.body;

    if (!message && !imageUrl) {
      return res.status(400).json({ error: "Message or image is required" });
    }

    // ตรวจสอบว่าใช้โมเดล Vision และมีรูปภาพ
    const isVisionModel = model === "qwen-vl-max-2025-04-08" && imageUrl;

    // สร้างโครงสร้างข้อมูลสำหรับโมเดล
    const inputMessages = isVisionModel
      ? [{
          role: "user",
          content: [
            { image: imageUrl },
            { text: message || "What's in this image?" }
          ]
        }]
      : [{
          role: "user",
          content: message
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
          input: {
            messages: inputMessages
          }
        }),
      }
    );

    const data = await response.json();
    
    // แสดงข้อผิดพลาดจาก API แบบละเอียด
    if (!response.ok) {
      console.error("API Error:", data);
      return res.status(response.status).json({ 
        error: data.message || "Error from DashScope API",
        details: data
      });
    }

    const answer = data?.output?.choices?.[0]?.message?.content || "No response from Qwen";

    return res.status(200).json({ answer });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
