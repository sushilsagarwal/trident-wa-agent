import OpenAI from "openai";
import { logger } from "./logger.js";

// DeepSeek uses an OpenAI-compatible API endpoint
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

const MODEL = "deepseek-prover-v2"; // DeepSeek V4 Pro / Prover V2

const SYSTEM_PROMPT = `You are a smart, concise AI assistant for TRIDENT — an advanced trading and analysis platform.

You help users with:
- General knowledge questions
- Market concepts (options, Nifty, BankNifty, trading strategies)
- Financial astrology insights
- Data analysis and calculations
- Coding and technical questions
- Any general AI assistant tasks

Formatting rules for WhatsApp:
- Use *bold* for important terms (WhatsApp markdown)
- Use _italics_ for emphasis
- Use numbered lists for steps
- Keep responses concise — WhatsApp is mobile-first
- No markdown headers (# ## ###) — they don't render in WhatsApp
- Use emojis sparingly but effectively
- If a response will be long, break it into clear sections with blank lines

Always be helpful, accurate, and professional. If you don't know something, say so clearly.`;

export async function getAIResponse(userMessage, history = []) {
  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-10), // Keep last 10 exchanges (memory window)
      { role: "user", content: userMessage },
    ];

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1024,
      messages,
    });

    const reply = response.choices[0]?.message?.content?.trim();

    if (!reply) throw new Error("Empty response from DeepSeek");

    logger.info(
      `🤖 DeepSeek tokens: ${response.usage?.prompt_tokens ?? "?"}in / ${response.usage?.completion_tokens ?? "?"}out`
    );

    return reply;
  } catch (err) {
    logger.error("DeepSeek API error:", err.message);

    if (err.status === 429) {
      return "⚠️ I'm receiving too many requests right now. Please try again in a moment.";
    }
    if (err.status === 401) {
      return "⚠️ AI service configuration error. Please contact the admin.";
    }

    return "❌ I encountered an error processing your request. Please try again.";
  }
}
