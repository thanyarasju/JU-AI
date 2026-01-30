export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, model, imageUrl } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const selectedModel = model || "qwen-max";

    const messages = [];

    if (!imageUrl) {
      messages.push({
        role: "system",
        content: `
You are Qwen, an open-source large language model.
Respond naturally and helpfully like Qwen Chat.
`
      });
    }

    messages.push({
      role: "user",
      content: message
    });

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

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json({
      answer: data.output.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
