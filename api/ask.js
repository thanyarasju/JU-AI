export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await fetch(
      "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
      {
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
                role: "system",
                content: `
You are Qwen, an open-source large language model.
Respond in a natural, conversational, and helpful tone, similar to Qwen Chat.
Explain step by step when appropriate.
Avoid overly formal language.
Do not overuse bullet points.
Keep answers clear, warm, and easy to read.
`
              },
              {
                role: "user",
                content: message
              }
            ]
          }
        }),
      }
    );

    const data = await response.json();

    const answer =
      data?.output?.choices?.[0]?.message?.content || "No response from Qwen";

    return res.status(200).json({ answer });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
