// server/tts.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const OPENAI_KEY = process.env.OPENAI_API_KEY; // keep this in server/.env

// Map language to OpenAI voice
const langToVoice = {
  "en-IN": "nova",       // or alloy, echo, fable, onyx, shimmer
  "en-US": "nova",
  "en": "nova",
  "hi": "nova",          // Hindi uses nova by default
  "or": "nova",          // Odia uses nova by default
};

// POST /tts { text: "hello", lang: "en-IN", format: "mp3" }
router.post("/", async (req, res) => {
  try {
    const { text, lang = "en-US", format = "mp3" } = req.body;
    if (!text) return res.status(400).json({ error: "text required" });

    console.log(`[TTS] Received request: text="${text}", lang="${lang}"`);

    // Check if OpenAI API key is configured
    if (!OPENAI_KEY) {
      console.warn("[TTS] ⚠️  OPENAI_API_KEY not configured in server/.env");
      console.warn("[TTS] Fallback: Client will use device TTS (expo-speech)");
      // Return success but signal client to use fallback
      return res.json({ 
        ok: false,
        message: "OpenAI key not configured - using device TTS fallback",
        fallbackToDevice: true 
      });
    }

    // Use correct OpenAI TTS endpoint
    const OPENAI_TTS_ENDPOINT = "https://api.openai.com/v1/audio/speech";

    const voice = langToVoice[lang] || "nova";
    const body = {
      model: "tts-1",      // Use tts-1 (faster) or tts-1-hd (higher quality)
      voice: voice,
      input: text,
    };

    console.log(`[TTS] Calling OpenAI with voice="${voice}"`);

    const r = await fetch(OPENAI_TTS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error(`[TTS] OpenAI error: ${r.status}`, txt);
      
      // Check if it's an API key error
      if (r.status === 401 || txt.includes("invalid_api_key")) {
        console.error("[TTS] ❌ Invalid OpenAI API key - check OPENAI_API_KEY in .env");
        return res.json({
          ok: false,
          message: "Invalid OpenAI key - using device TTS fallback",
          fallbackToDevice: true,
          error: "invalid_api_key"
        });
      }
      
      return res.status(502).json({ error: "TTS provider error", detail: txt });
    }

    // OpenAI returns binary audio directly
    const arrayBuffer = await r.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    console.log(`[TTS] ✅ Successfully generated audio, size: ${(base64.length / 1024).toFixed(2)}KB`);

    return res.json({ 
      ok: true,
      audio: base64, 
      mime: "audio/mpeg" 
    });
  } catch (err) {
    console.error("[TTS] Error:", err);
    // Don't crash - let client fallback to device TTS
    return res.json({
      ok: false,
      message: "TTS error - falling back to device TTS",
      fallbackToDevice: true,
      error: err.message
    });
  }
});

export default router;
