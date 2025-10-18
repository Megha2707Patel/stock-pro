// server/src/routes/ai.js
import { Router } from "express";
import OpenAI from "openai";

const router = Router();
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// POST /api/ai/ask
router.post("/ask", async (req, res) => {
  try {
    // Guard so the app doesn't crash when key is missing
    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(503)
        .json({ error: "AI is disabled. Set OPENAI_API_KEY in environment variables." });
    }

    const { question } = req.body || {};
    const q = (question || "").trim();
    if (!q) return res.status(400).json({ error: "Please provide a question" });

    // Create client only when we know the key exists
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const resp = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: "You are a concise, helpful assistant for a stock app." },
        { role: "user", content: q },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const text = resp?.choices?.[0]?.message?.content?.trim()
      || "Sorry, I couldn't generate a reply.";
    return res.json({ answer: text });
  } catch (err) {
    console.error("AI error:", err?.message || err);
    return res.status(500).json({ error: "AI failed. Check server logs." });
  }
});

// (Optional) quick status check: /api/ai/status -> { aiEnabled: true/false }
router.get("/status", (_req, res) => {
  res.json({ aiEnabled: Boolean(process.env.OPENAI_API_KEY) });
});

export default router;
