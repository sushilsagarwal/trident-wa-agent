import { logger } from "./logger.js";

const WA_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

const headers = () => ({
  Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
});

// Send a text message to a WhatsApp user
export async function sendWhatsAppMessage(to, text) {
  // WhatsApp has a 4096 char limit — split if needed
  const chunks = splitMessage(text, 4000);

  for (const chunk of chunks) {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: chunk,
      },
    };

    const res = await fetch(WA_API_URL, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      logger.error("WhatsApp send error:", JSON.stringify(data));
      throw new Error(`WhatsApp API error: ${data.error?.message}`);
    }

    // Small delay between chunks
    if (chunks.length > 1) await sleep(500);
  }
}

// Mark message as read / show typing (best-effort)
export async function sendTypingIndicator(to) {
  try {
    const payload = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: `fake_${Date.now()}`, // typing indicator trick
    };
    await fetch(WA_API_URL.replace("/messages", "/messages"), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-critical, ignore
  }
}

// Send a template message (for opt-in / first contact)
export async function sendTemplateMessage(to, templateName, langCode = "en_US") {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: langCode },
    },
  };

  const res = await fetch(WA_API_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  return res.json();
}

// Utility: split long messages into chunks
function splitMessage(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    let end = i + maxLen;
    // Try to break at newline or space
    if (end < text.length) {
      const breakAt = text.lastIndexOf("\n", end);
      if (breakAt > i) end = breakAt + 1;
    }
    chunks.push(text.slice(i, end));
    i = end;
  }
  return chunks;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
