import { sendWhatsAppMessage, sendTypingIndicator } from "./whatsapp.js";
import { getAIResponse } from "./claude.js";
import { getOrCreateSession, updateSession } from "./session.js";
import { logger } from "./logger.js";

// Meta webhook verification
export function verifyWebhook(req, res) {
  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    logger.info("✅ Webhook verified by Meta");
    return res.status(200).send(challenge);
  }
  logger.warn("❌ Webhook verification failed");
  return res.sendStatus(403);
}

// Main webhook handler
export async function handleWebhook(req, res) {
  // Acknowledge immediately (Meta requires <5s response)
  res.sendStatus(200);

  try {
    const body = req.body;

    if (body.object !== "whatsapp_business_account") return;

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Skip status updates (delivered, read receipts)
    if (value?.statuses) return;

    const messages = value?.messages;
    if (!messages?.length) return;

    const message = messages[0];
    const from = message.from; // sender's phone number
    const messageId = message.id;

    // Only handle text messages for now
    if (message.type !== "text") {
      await sendWhatsAppMessage(
        from,
        "I currently support text messages only. Please type your question! 🤖"
      );
      return;
    }

    const userText = message.text.body.trim();
    logger.info(`📩 Message from ${from}: ${userText.substring(0, 80)}...`);

    // Get or create conversation session
    const session = getOrCreateSession(from);

    // Send typing indicator
    await sendTypingIndicator(from);

    // Get AI response
    const aiReply = await getAIResponse(userText, session.history);

    // Update session history
    updateSession(from, userText, aiReply);

    // Send reply back
    await sendWhatsAppMessage(from, aiReply);

    logger.info(`✅ Replied to ${from}`);
  } catch (err) {
    logger.error("Webhook processing error:", err.message);
  }
}
