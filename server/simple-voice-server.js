// ===========================================
// KAVACH VOICE ASSISTANT - MINIMAL BACKEND
// Requires: express, cors, dotenv only
// ===========================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
dotenv.config({ path: join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let deepgramAvailable = false;
let deepgramClient = null;

// Try to load Deepgram SDK
try {
  const { createClient } = await import("@deepgram/sdk");
  const DEEPGRAM_KEY = process.env.DEEPGRAM_API_KEY;
  
  if (!DEEPGRAM_KEY) {
    console.warn("⚠️  DEEPGRAM_API_KEY environment variable not set");
  } else {
    deepgramClient = createClient(DEEPGRAM_KEY);
    deepgramAvailable = true;
    console.log("✅ Deepgram SDK v4 loaded and ready");
    console.log("🔑 API Key configured:", DEEPGRAM_KEY.substring(0, 10) + "...");
  }
} catch (err) {
  console.error("❌ Deepgram SDK load error:", err.message);
  console.log("⚠️  Voice transcription will be disabled");
}

// ===========================================
// ROUTES
// ===========================================

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    port: PORT,
    deepgramReady: deepgramAvailable && !!process.env.DEEPGRAM_API_KEY,
  });
});

// Speech-to-Text Endpoint - Using multer for FormData
app.post("/assistant/transcribe", upload.single('audio'), async (req, res) => {
  try {
    // Handle uploaded audio file from FormData
    let audioBuffer = null;

    if (req.file && req.file.buffer) {
      audioBuffer = req.file.buffer;
      console.log("📦 Received FormData audio file:", audioBuffer.length, "bytes");
      console.log("📋 File info:", {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } else {
      return res.status(400).json({
        error: "No audio file received in FormData - expected 'audio' field",
        text: "",
      });
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({
        error: "No audio data received",
        text: "",
      });
    }

    console.log("✅ Audio received:", audioBuffer.length, "bytes");
    console.log("   Attempting Deepgram transcription...");

    if (!deepgramAvailable) {
      console.warn("⚠️  Deepgram SDK not available");
      return res.json({
        text: "[STT disabled]",
        placeholder: true,
      });
    }

    if (!process.env.DEEPGRAM_API_KEY) {
      console.warn("⚠️  DEEPGRAM_API_KEY not set");
      return res.status(500).json({
        error: "Missing DEEPGRAM_API_KEY in server/.env",
        text: "",
      });
    }

    // Call Deepgram with NexaVault-optimized parameters
    try {
      console.log("🎤 Calling Deepgram Nova-2 model...");
      
      // Deepgram SDK v4: Use transcribeFile with buffer (correct method name)
      const { result: response, error } = await deepgramClient.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          model: "nova-2", // 95% accuracy model (NexaVault standard)
          language: "en", // Explicit language (prevents detection errors)
          smart_format: true, // Automatic punctuation
          utterances: true, // Detect utterances for better segmentation
        }
      );
      
      if (error) {
        console.error("❌ Deepgram error:", error);
        throw new Error(error.message || "Deepgram transcription failed");
      }

      if (!response) {
        console.error("❌ Deepgram error: Empty response");
        return res.status(500).json({
          error: "Deepgram transcription failed: empty response",
          text: "",
        });
      }

      const transcript = response?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
      // NexaVault Pattern: Extract confidence score for client-side filtering
      const confidence = response?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

      console.log("✅ Transcription result:", transcript ? `"${transcript}"` : "[empty]");
      console.log(`📊 Confidence score: ${(confidence * 100).toFixed(1)}%`);

      // Return both text and confidence score
      res.json({ 
        text: transcript,
        confidence: confidence, // 0-1 scale, client filters if < 0.5
        success: true
      });
    } catch (deepgramErr) {
      console.error("❌ Deepgram API error:", deepgramErr.message);
      
      // NexaVault Pattern: Classify error for better client-side handling
      let errorCode = "DEEPGRAM_ERROR";
      if (deepgramErr.message.includes("401") || deepgramErr.message.includes("authentication")) {
        errorCode = "AUTH_ERROR";
      } else if (deepgramErr.message.includes("429")) {
        errorCode = "RATE_LIMIT";
      } else if (deepgramErr.message.includes("timeout")) {
        errorCode = "TIMEOUT";
      }
      
      res.status(500).json({
        error: "Deepgram API call failed",
        text: "",
        errorCode: errorCode,
        detail: deepgramErr.message,
      });
    }
  } catch (err) {
    console.error("❌ Transcribe error:", err.message);
    res.status(500).json({
      error: err.message,
      text: "",
    });
  }
});

// Intent Parsing
app.post("/assistant/parse", (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    const lower = text.toLowerCase();
    let intent = "unknown";
    let entities = {};
    let replyText = "I didn't understand that. Can you please rephrase?";
    let actionSuggested = "none";
    let confidence = 0.5;

    // Send Money
    if (
      lower.includes("send") ||
      lower.includes("pay") ||
      lower.includes("transfer")
    ) {
      intent = "send_money";
      actionSuggested = "prefill_and_navigate_upi";
      confidence = 0.85;

      // Extract amount
      const amountMatch = lower.match(/(\d+(?:\.\d{2})?)/);
      if (amountMatch) {
        entities.amount = amountMatch[1];
      }

      // Extract recipient
      let recipientMatch = lower.match(/(?:to|for)\s+([a-z]+(?:\s+[a-z]+)?)/i);
      if (recipientMatch) {
        entities.recipient = recipientMatch[1].trim();
      } else {
        recipientMatch = lower.match(/(?:send|pay|transfer)\s+([a-z]+)/i);
        if (recipientMatch) {
          entities.recipient = recipientMatch[1].trim();
        }
      }

      replyText = entities.recipient
        ? `Okay, sending ₹${entities.amount || "..."} to ${entities.recipient}.`
        : `Okay, sending ₹${entities.amount || ""}.`;
    }
    // Balance
    else if (lower.includes("balance")) {
      intent = "check_balance";
      actionSuggested = "ask_pin_for_balance";
      replyText = "Let me fetch your balance.";
      confidence = 0.85;
    }
    // History
    else if (lower.includes("history")) {
      intent = "view_history";
      actionSuggested = "show_history";
      replyText = "Showing your transaction history.";
      confidence = 0.85;
    }
    // QR
    else if (lower.includes("qr") || lower.includes("scan")) {
      intent = "scan_qr";
      actionSuggested = "scan_qr";
      replyText = "Let me open the QR scanner.";
      confidence = 0.8;
    }
    // Fraud
    else if (
      lower.includes("fraud") ||
      lower.includes("suspicious") ||
      lower.includes("security")
    ) {
      intent = "check_fraud";
      actionSuggested = "check_fraud";
      replyText = "Let me check for fraud indicators.";
      confidence = 0.8;
    }

    console.log(`🧠 Intent: ${intent} | Confidence: ${confidence}`);
    console.log(`📦 Entities:`, JSON.stringify(entities));
    console.log(`🎯 Action: ${actionSuggested}`);

    res.json({
      intent,
      entities,
      replyText,
      actionSuggested,
      confidence,
      detectedLanguage: "en",
    });
  } catch (err) {
    console.error("❌ Parse error:", err);
    res.status(500).json({ error: err.message });
  }
});

// TTS endpoint (fallback)
app.post("/tts", (req, res) => {
  res.json({
    ok: false,
    fallbackToDevice: true,
    message: "Using device TTS fallback",
  });
});

// ===========================================
// START SERVER
// ===========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  🎤 KAVACH VOICE ASSISTANT BACKEND    ║`);
  console.log(`║     v2.0 (Simplified)                  ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
  console.log(`✅ Server listening on http://localhost:${PORT}`);
  console.log(`   http://0.0.0.0:${PORT} (all interfaces)\n`);
  console.log(`📍 Endpoints:\n`);
  console.log(`   GET  /health`);
  console.log(`        Check server status\n`);
  console.log(`   POST /assistant/transcribe`);
  console.log(`        Convert speech → text (requires Deepgram)\n`);
  console.log(`   POST /assistant/parse`);
  console.log(`        Analyze intent from text\n`);
  console.log(`   POST /tts`);
  console.log(`        Text-to-speech (device fallback)\n`);

  if (!deepgramAvailable || !process.env.DEEPGRAM_API_KEY) {
    console.log(`⚠️  WARNING:\n`);
    console.log(
      `   DEEPGRAM_API_KEY is not configured or SDK not loaded!`
    );
    console.log(`   Voice transcription will NOT work.\n`);
    console.log(`   To fix:\n`);
    console.log(`   1. Get key from: https://console.deepgram.com\n`);
    console.log(`   2. Add to server/.env:\n`);
    console.log(`      DEEPGRAM_API_KEY=your_key_here\n`);
    console.log(`   3. Ensure dependencies installed:\n`);
    console.log(`      npm install\n`);
    console.log(`   4. Restart this server\n`);
  } else {
    console.log(`✅ Deepgram STT ready\n`);
  }
});
