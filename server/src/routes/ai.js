import { Router } from "express";
import OpenAI from "openai";

const router = Router();
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Quick status
router.get("/status", (_req, res) => {
  res.json({ aiEnabled: Boolean(process.env.OPENAI_API_KEY), model: OPENAI_MODEL });
});

// Echo (useful for debugging JSON shape)
router.post("/echo", (req, res) => {
  res.json({ received: req.body || null });
});

// Main: /api/ai/ask
router.post("/ask", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "AI disabled: set OPENAI_API_KEY" });
    }

    const question = (req.body?.question || "").trim();
    if (!question) return res.status(400).json({ error: "Please provide a question" });

    // Create the client *inside* the handler (prevents crash at import time)
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const out = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: "You are a concise, helpful assistant for a stock app." },
        { role: "user", content: question }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const answer = out?.choices?.[0]?.message?.content?.trim() || "No answer.";
    res.json({ answer });
  } catch (err) {
    // Surface the real reason to the client
    const msg =
      err?.response?.data?.error?.message  // OpenAI API error shape
      || err?.message
      || String(err);
    console.error("AI error:", msg);
    res.status(500).json({ error: msg });
  }
});

export default router;
