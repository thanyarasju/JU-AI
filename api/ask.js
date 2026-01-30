export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // ใช้แค่โมเดลเดียว ไม่มีรูปภาพ
    const API_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

    console.log("📡 Sending request to:", API_URL);
    console.log("🔑 API Key exists:", !!process.env.DASHSCOPE_API_KEY);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen3-max-2026-01-23",
        input: {
          messages: [
            {
              role: "user",
              content: message
            }
          ]
        }
      }),
    });

    console.log("📊 Response status:", response.status);

    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ API Error:", JSON.stringify(data, null, 2));
      return res.status(response.status).json({
        error: "API Error",
        status: response.status,
        data: data
      });
    }

    const answer = data?.output?.choices?.[0]?.message?.content || "No response";
    
    console.log("✅ Success! Answer:", answer.substring(0, 50) + "...");

    return res.status(200).json({ answer });

  } catch (err) {
    console.error("💥 Server Error:", err);
    return res.status(500).json({ 
      error: "Server Error",
      message: err.message,
      stack: err.stack
    });
  }
}
