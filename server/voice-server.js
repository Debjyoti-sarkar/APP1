// ===========================================
// KAVACH VOICE ASSISTANT BACKEND - SIMPLIFIED
// ===========================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@deepgram/sdk";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, ".env") });

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// File upload
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Deepgram
const DEEPGRAM_KEY = process.env.DEEPGRAM_API_KEY;
console.log("🔑 Deepgram API Key:", DEEPGRAM_KEY ? "✅ LOADED" : "❌ MISSING!");

let deepgram;
if (DEEPGRAM_KEY) {
  try {
    deepgram = createClient(DEEPGRAM_KEY);
    console.log("✅ Deepgram client initialized");
  } catch (err) {
    console.error("❌ Deepgram init error:", err.message);
  }
}

// ===========================================
// ROUTES
// ===========================================

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    port: PORT,
    deepgramReady: !!deepgram,
  });
});

// Speech-to-Text
app.post("/assistant/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    if (!deepgram) {
      return res.status(500).json({
        error: "Deepgram not initialized",
        text: "Check DEEPGRAM_API_KEY in server/.env",
      });
    }

    console.log("🎤 Received audio:", req.file.mimetype, req.file.size, "bytes");

    // Transcribe with Deepgram
    try {
      const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        req.file.buffer,
        {
          model: "nova-2",
          language: "en",
          smart_format: true,
        }
      );

      if (error) {
        console.error("❌ Deepgram error:", error);
        return res.status(500).json({
          error: "Deepgram transcription failed",
          text: "Could not transcribe audio",
        });
      }

      const transcript =
        result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
      console.log("✅ Transcribed:", transcript);

      res.json({ text: transcript });
    } catch (deepgramError) {
      console.error("❌ Deepgram API error:", deepgramError.message);
      res.status(500).json({
        error: "Deepgram error",
        details: deepgramError.message,
        text: "",
      });
    }
  } catch (err) {
    console.error("❌ Transcribe error:", err);
    res.status(500).json({ error: err.message, text: "" });
  }
});

// Intent parsing (NLU)
app.post("/assistant/parse", (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const lower = text.toLowerCase();
    let intent = "unknown";
    let entities = {};
    let replyText = "I didn't understand that.";
    let actionSuggested = "none";

    // Simple intents
    if (lower.includes("send") || lower.includes("pay") || lower.includes("transfer")) {
      intent = "send_money";
      actionSuggested = "prefill_and_navigate_upi";

      // Extract amount
      const amountMatch = lower.match(/\d+/);
      if (amountMatch) {
        entities.amount = amountMatch[0];
      }

      // Extract recipient
      const recipientMatch = lower.match(/(?:to|for)\s+([a-z]+(?:\s+[a-z]+)?)/i);
      if (recipientMatch) {
        entities.recipient = recipientMatch[1].trim();
      }

      replyText = entities.recipient
        ? `Okay, sending ₹${entities.amount || "..."} to ${entities.recipient}.`
        : `Okay, sending ₹${entities.amount || ""}.`;
    } else if (lower.includes("balance")) {
      intent = "check_balance";
      actionSuggested = "ask_pin_for_balance";
      replyText = "Let me fetch your balance.";
    } else if (lower.includes("history")) {
      intent = "view_history";
      actionSuggested = "show_history";
      replyText = "Showing your transaction history.";
    } else if (lower.includes("qr")) {
      intent = "scan_qr";
      actionSuggested = "scan_qr";
      replyText = "Let me open the QR scanner.";
    } else if (lower.includes("fraud") || lower.includes("security")) {
      intent = "check_fraud";
      actionSuggested = "check_fraud";
      replyText = "Checking for fraud indicators.";
    }

    console.log("🧠 Intent:", intent, "| Reply:", replyText);

    res.json({
      intent,
      entities,
      replyText,
      actionSuggested,
      confidence: intent === "unknown" ? 0.5 : 0.85,
    });
  } catch (err) {
    console.error("❌ Parse error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Text-to-Speech (fallback if OpenAI key available)
app.post("/tts", (req, res) => {
  try {
    const { text, lang } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // For now, just signal client to use device TTS
    res.json({
      ok: false,
      fallbackToDevice: true,
      message: "TTS not configured. Using device TTS fallback.",
    });
  } catch (err) {
    res.json({
      ok: false,
      fallbackToDevice: true,
      message: "TTS error: using device TTS fallback",
    });
  }
});

// ===========================================
// START SERVER
// ===========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  🎤 KAVACH VOICE ASSISTANT BACKEND    ║`);
  console.log(`║     Port: ${PORT}                            ║`);
  console.log(`╚════════════════════════════════════════╝`);
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`\n📍 Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /assistant/transcribe - Speech-to-Text`);
  console.log(`   POST /assistant/parse - Intent Recognition`);
  console.log(`   POST /tts - Text-to-Speech\n`);

  if (!DEEPGRAM_KEY) {
    console.log(`\n⚠️  WARNING: DEEPGRAM_API_KEY not set!`);
    console.log(`   Voice transcription will fail.`);
    console.log(`   Add DEEPGRAM_API_KEY to server/.env\n`);
  }
});

export default app;
