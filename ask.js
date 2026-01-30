export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const response = await fetch(
      "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation", // ✅ ลบช่องว่าง + แก้โดเมน
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.DASHSCOPE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen3-max-2026-01-23",
          input: {
            messages: [
              { role: "user", content: message }
            ]
          }
        })
      }
    );

    const data = await response.json();
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
