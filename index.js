import express from "express";
import { handleWebhook, verifyWebhook } from "./webhook.js";
import { logger } from "./logger.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "online",
    agent: "TRIDENT WhatsApp AI Agent",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Meta webhook verification (GET)
app.get("/webhook", verifyWebhook);

// Incoming WhatsApp messages (POST)
app.post("/webhook", handleWebhook);

app.listen(PORT, () => {
  logger.info(`🚀 TRIDENT WhatsApp Agent running on port ${PORT}`);
});
