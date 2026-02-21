const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

/**
 * Voice Assistant Routes
 * Handles transcription and NLU for voice assistant feature
 */

// @route   POST /api/assistant/parse
// @desc    Parse text for intent and entities
// @access  Public
router.post("/parse", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        error: "Invalid text provided",
        intent: "unknown",
        entities: {},
        confidence: 0,
        replyText: "Please provide valid text",
        actionSuggested: "none",
      });
    }

    const lower_text = text.toLowerCase();

    let intent = "unknown";
    let entities = {};
    let replyText = "I'm sorry, I didn't understand that. Can you please rephrase?";
    let actionSuggested = "none";
    let confidence = 0.5;

    // Intent detection rules

    // Send Money
    if (
      ["send", "pay", "transfer"].some((word) => lower_text.includes(word)) ||
      (["rupees", "rs", "₹"].some((word) => lower_text.includes(word)) &&
        /\d+/.test(lower_text))
    ) {
      intent = "send_money";
      replyText = "I'll help you send money. Opening the payment screen.";
      actionSuggested = "prefill_and_navigate_upi";
      confidence = 0.85;

      // Extract amount
      const amountMatch = text.match(/(\d+(?:\.\d{2})?)\s*(?:rupees?|rs\.?|₹)?/i);
      if (amountMatch) {
        entities.amount = amountMatch[1];
        replyText = `I'll help you send ₹${amountMatch[1]}. Opening the payment screen.`;
      }

      // Extract recipient
      const toMatch = text.match(/to\s+(\w+)/i);
      if (toMatch) {
        entities.recipient = toMatch[1];
        if (entities.amount) {
          replyText = `I'll help you send ₹${entities.amount} to ${entities.recipient}. Opening the payment screen.`;
        } else {
          replyText = `I'll help you send money to ${entities.recipient}. Opening the payment screen.`;
        }
      }
    }
    // Check Balance
    else if (
      ["balance", "how much", "account"].some((word) =>
        lower_text.includes(word)
      )
    ) {
      intent = "check_balance";
      replyText = "Let me show you your account balance. Please enter your PIN.";
      actionSuggested = "ask_pin_for_balance";
      confidence = 0.9;
    }
    // Transaction History
    else if (
      ["history", "transaction", "recent", "activity"].some((word) =>
        lower_text.includes(word)
      )
    ) {
      intent = "view_history";
      replyText = "Here are your recent transactions.";
      actionSuggested = "show_history";
      confidence = 0.85;
    }
    // Scan QR
    else if (lower_text.includes("scan") && lower_text.includes("qr")) {
      intent = "scan_qr";
      replyText = "Opening the QR scanner for you.";
      actionSuggested = "scan_qr";
      confidence = 0.9;
    }
    // Fraud Check
    else if (
      ["fraud", "scam", "suspicious", "fake"].some((word) =>
        lower_text.includes(word)
      )
    ) {
      intent = "check_fraud";
      replyText = "Let me check this for potential fraud.";
      actionSuggested = "check_fraud";
      confidence = 0.85;
    }
    // Help
    else if (
      ["help", "support", "settings", "assist"].some((word) =>
        lower_text.includes(word)
      )
    ) {
      intent = "help";
      replyText = "Opening the help and settings page.";
      actionSuggested = "help_support_page";
      confidence = 0.8;
    }
    // Greeting
    else if (
      ["hello", "hi", "hey", "good morning", "good evening"].some((word) =>
        lower_text.includes(word)
      )
    ) {
      intent = "greeting";
      replyText =
        "Hello! How can I help you today? You can ask me to send money, check balance, view transactions, or scan a QR code.";
      actionSuggested = "none";
      confidence = 0.95;
    }
    // Thank you
    else if (
      ["thank", "thanks", "bye", "goodbye"].some((word) =>
        lower_text.includes(word)
      )
    ) {
      intent = "farewell";
      replyText = "You're welcome! Have a great day!";
      actionSuggested = "none";
      confidence = 0.9;
    }

    console.log(`🎤 Voice Intent Detected:
      - Intent: ${intent}
      - Text: ${text}
      - Confidence: ${confidence}
      - Action: ${actionSuggested}`);

    res.json({
      intent,
      entities,
      confidence,
      replyText,
      actionSuggested,
      detectedLanguage: "en",
    });
  } catch (error) {
    console.error("❌ Parse error:", error);
    res.status(500).json({
      error: "Error processing voice input",
      message: error.message,
    });
  }
});

// @route   POST /api/assistant/transcribe
// @desc    Convert audio to text (Speech-to-Text)
// @access  Public
router.post("/transcribe", async (req, res) => {
  try {
    console.log("🎤 Audio transcription request received");

    // Check if audio file exists in request
    if (!req.file) {
      console.log("⚠️ No audio file provided");
      return res.status(400).json({
        error: "No audio file provided",
        hint: "Send audio as multipart/form-data with field name 'audio'",
      });
    }

    console.log("📁 Audio file received:", {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // For now, return a default transcription
    // In production, integrate with:
    // - Google Cloud Speech-to-Text
    // - Azure Speech Services
    // - Deepgram
    // - AssemblyAI
    // - Local Whisper (free, local)

    const mockTranscription =
      "Tell me to send five hundred rupees to john today"; // Example for testing

    console.log("✅ Transcription complete:", mockTranscription);

    res.json({
      text: mockTranscription,
      confidence: 0.85,
      debug: {
        message: "Using mock transcription. Configure real STT for production.",
        file: {
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
        },
        options: [
          "Google Cloud Speech-to-Text (recommended)",
          "Deepgram (free tier available)",
          "AssemblyAI",
          "Local OpenAI Whisper (free, offline)",
        ],
      },
    });
  } catch (error) {
    console.error("❌ Transcription error:", error);
    res.status(500).json({
      error: "Failed to process audio",
      message: error.message,
      hint: "Ensure audio file is properly formatted and backend has STT service configured",
    });
  }
});

module.exports = router;
