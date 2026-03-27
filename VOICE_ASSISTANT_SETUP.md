# 🎤 VOICE ASSISTANT SETUP GUIDE

## ⚡ Quick Start (3 Steps)

### Step 1: Fix Backend Port ✅ [DONE]
- ✅ Updated `services/assistant.ts` to use `http://localhost:3001` (was incorrectly using 5000)
- Make sure you run the backend: `npm start` in `/server` directory

### Step 2: Get FREE API Keys 🔑

#### **A. DEEPGRAM API KEY (Speech-to-Text)**
This allows users to send voice commands that get converted to text.

**Steps:**
1. Go to: https://console.deepgram.com
2. Sign up (free account)
3. Create an API key (free tier: 50,000 requests/month - plenty!)
4. Copy your API key
5. Paste in `server/.env`:
   ```
   DEEPGRAM_API_KEY=your_key_here
   ```

**Cost:** FREE (50K requests/month)  
**Alternative:** Already have a Deepgram key? Just add it to `.env`

---

#### **B. OPENAI API KEY (Text-to-Speech)**
This allows the voice assistant to speak responses back to the user.

**Steps:**
1. Go to: https://platform.openai.com/api-keys
2. Sign up / Login with your OpenAI account
3. Create new API key
4. Copy your API key
5. Paste in `server/.env`:
   ```
   OPENAI_API_KEY=your_key_here
   ```

**Cost:** Minimal (TTS is cheap at ~$15/hour of audio)  
**Alternative:** If you don't have this, the app will fall back to device's built-in TTS (expo-speech)

---

### Step 3: Start the Backend Server

```bash
# Navigate to server directory
cd server

# Install dependencies (if not already done)
npm install

# Start the server
npm start
# OR for development with auto-reload:
npm run dev
```

**Expected output:**
```
============================================
✅ KAVACH Backend Running on port 3001
📍 Health: http://localhost:3001/health
🎤 STT: POST /assistant/transcribe
🧠 NLU: POST /assistant/parse
============================================
```

---

## 🧪 Test the Voice Assistant

1. **Start your React Native app:**
   ```bash
   npm start  # from root directory
   ```

2. **Navigate to Voice Assistant Screen**

3. **Test voice input:**
   - Click the microphone button
   - Say: "Send 500 rupees to John"
   - Should hear: "Okay, sending ₹500 to john"
   - Should navigate to SendMoney screen

---

## 🔧 Architecture

```
User speaks into microphone
        ↓
VoiceRecorder.tsx captures audio
        ↓
Sends to: http://localhost:3001/assistant/transcribe
        ↓
Deepgram API (DEEPGRAM_API_KEY) converts speech → text
        ↓
Text sent to: /assistant/parse (NLU) 
        ↓
Extracts intent + entities (send_money, recipient, amount, etc)
        ↓
Response text sent back
        ↓
TTS converts response → speech (via OpenAI or device TTS)
        ↓
User hears the response
```

---

## 🚨 Common Issues & Fixes

### ❌ "Network error - backend not running"
- Make sure `npm start` is running in `/server` directory
- Check port is 3001: `http://localhost:3001/health`
- Try: `netstat -ano | findstr :3001` (Windows) to see if port is in use

### ❌ "Transcription failed"
- **Missing DEEPGRAM_API_KEY** in `server/.env`
- Check .env file is in `/server` directory (not root)
- Restart the server after updating .env

### ❌ "Audio not playing / No TTS"
- **Missing OPENAI_API_KEY** in `server/.env`
- OR audio permission not granted on device
- OR app is using fallback (device TTS) which is fine

### ❌ "Timeout waiting for response"
- Backend might be slow to load model
- Wait 30 seconds after starting server
- Check server logs for errors

---

## 📊 API Limits (FREE TIER)

| Service | Monthly Requests | Cost |
|---------|-----------------|------|
| Deepgram (STT) | 50,000 | FREE |
| OpenAI TTS | 100,000+ | $15/hour of audio |
| Parse (Local) | Unlimited | FREE |

---

## 🔐 Security Note

- **NEVER commit API keys to Git** (already in `.gitignore`)
- Keep `.env` file private
- Rotate keys if accidentally exposed
- Use environment variables in production (don't hardcode)

---

## 💡 Custom Voice Assistant Features

Add these to `server/index.js` to expand capabilities:

```javascript
// Example: Add custom intent
if (lower.includes("what's my balance")) {
  intent = "check_balance";
  actionSuggested = "ask_pin_for_balance";
  replyText = "Let me fetch your account balance";
}
```

---

## 📞 Support

If you have issues:
1. Check `server/server.log` for backend errors
2. Enable browser DevTools to see network requests
3. Test backend directly: `curl http://localhost:3001/health`
4. Check API key validity on provider websites

---

## ✅ Checklist Before Going Live

- [ ] Deepgram API key added to `/server/.env`
- [ ] OpenAI API key added to `/server/.env` (or skip for fallback TTS)
- [ ] Backend server running on port 3001
- [ ] React Native app connecting to correct backend URL
- [ ] Voice input working and transcribing
- [ ] Voice responses working (TTS)
- [ ] Navigation working for intents (send money, check balance, etc)

---

**🎉 Once all setup is done, your voice assistant will be fully functional!**
