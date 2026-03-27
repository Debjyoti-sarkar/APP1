# 🚀 COMPLETE PROJECT STARTUP GUIDE - EXPO GO

## ⏱️ TOTAL TIME: 10 minutes from scratch

---

## 📋 PRE-FLIGHT CHECKLIST

Before starting, verify you have:

- ✅ **Node.js installed** → `node --version` (should show v18+)
- ✅ **Expo Go app** on phone (free from App Store or Google Play)
- ✅ **Phone & Computer on same WiFi** (critical for Expo to work)
- ✅ **Deepgram API Key** in `server/.env` (already configured at `908a9c92...`)
- ✅ **Port 3001 available** (check: `netstat -ano | findstr ":3001"`)

---

## 🔧 STEP 1: KILL OLD PROCESSES (1 minute)

**Windows PowerShell:**
```powershell
# Kill any old Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Verify nothing is on port 3001
netstat -ano | findstr ":3001"

# Should return nothing or show it's available
```

---

## 🚀 STEP 2: START BACKEND SERVER (2 minutes)

**Open Terminal/PowerShell #1:**

```powershell
# Navigate to server folder
cd c:\Users\DebSarkar\Desktop\KAVACH-main\server

# Start the backend
node simple-voice-server.js
```

**Wait for these messages:**
```
✅ Deepgram SDK v4 loaded and ready
🔑 API Key configured: 908a9c92...
🌍 CORS enabled for mobile apps
🚀 Server listening on port 3001
```

✅ **If you see all these messages, backend is READY!**

❌ **If you see errors:**
- Check Deepgram key in `server/.env` is correct (should be 40 chars)
- Check port 3001 is not in use: `Get-Process node | Stop-Process -Force`
- Try again

---

## 💻 STEP 3: START EXPO FRONTEND (1 minute)

**Open Terminal/PowerShell #2 (NEW window):**

```powershell
# Navigate to main project folder
cd c:\Users\DebSarkar\Desktop\KAVACH-main

# Start Expo development server
npx expo start
```

**You should see:**
```
Starting Expo CLI...
 ✓ Loaded expo config
 
 › Metro server started on port 8081.
 › Tunnel started. Remote URL: exp://xx.xx.xx.x:8081
 
 › Press 'a' to open Android Emulator
 › Press 'i' to open iOS Simulator
 › Press 'e' to send to your phone with Expo Go
 › Press 'w' to open web
 › Press 'j' to open Debugger
 › Press 'r' to reload
 › Press 'm' to toggle menu
 › Press 'o' to open in browser
 › Press 'c' to show QR code
```

✅ **If you see this menu, Expo is READY!**

---

## 📱 STEP 4: CONNECT YOUR PHONE (2 minutes)

### **Option A: QR Code (Fastest)**

**In the Terminal where Expo is running:**
```
Press 'e'
```

You'll see:
```
Asking to send me an SMS to download the app...
```

**On your phone:**
1. **Android**: Open **Expo Go** app → Tap **"Scan QR Code"** → Point at Terminal QR
2. **iOS**: Open **Camera app** → Point at Terminal QR → Tap "Expo Go"

App will load automatically! ✅

---

### **Option B: Manual QR Scan**

**In the Terminal where Expo is running:**
```
Press 'c'
```

QR code appears in Terminal. Scan with your phone camera/Expo Go.

---

### **Option C: Manual URL Entry**

**In the Terminal where Expo is running:**
```
Press 'm' to show menu
Look for: exp://xxx.xxx.xxx.x:8081
```

**On your phone in Expo Go:**
1. Tap the **hamburger menu** (≡)
2. Tap **"Enter URL"**
3. Copy-paste the URL from Terminal
4. Press Enter

---

## ✅ STEP 5: WAIT FOR APP TO LOAD (2 minutes)

Once you scan the QR code:

```
Loading app from Expo...
Downloading JavaScript bundle...
Loading modules...
```

**You should see the KAVACH app load on your phone** with:
- Bottom navigation tabs
- Initial screen (probably home or login)

✅ **App is now running!**

---

## 🎤 STEP 6: NAVIGATE TO VOICE ASSISTANT (30 seconds)

**On your phone:**

1. **Find the Voice Assistant tab/screen**
   - Look in bottom navigation or side menu
   - Should be labeled: "Voice Assistant" or "🎤" icon

2. **Tap to open Voice Assistant screen**

3. **You should see:**
   ```
   ┌─────────────────────────┐
   │   Voice Assistant       │
   │  Speak or type request  │
   ├─────────────────────────┤
   │ ✅ Test Connection      │
   │ (green checkmark)       │
   ├─────────────────────────┤
   │    [Chat messages]      │
   │ (empty initially)       │
   ├─────────────────────────┤
   │   [Microphone button]   │
   │   (circular, large)     │
   ├─────────────────────────┤
   │   [Type here...] [Send] │
   └─────────────────────────┘
   ```

✅ **If you see this, everything is connected!**

---

## 🧪 STEP 7: TEST BACKEND CONNECTION (30 seconds)

**On your phone in Voice Assistant:**

1. **Look for "Test Connection" section**
2. You should see: ✅ **"Backend is running on port 3001"** in GREEN

❌ **If you see RED error:**
```
❌ Connection failed: Cannot reach http://localhost:3001
```

**Fix:**
- Make sure backend is running (check Terminal #1)
- Check backend shows: "🚀 Server listening on port 3001"
- Backend and phone must be on SAME WiFi network

---

## 🎤 STEP 8: TEST VOICE FEATURE (2 minutes)

### **Test: Send Money Voice Payment**

**On your phone in Voice Assistant:**

1. **Tap the microphone button** (large circular button)
   - It will turn RED/highlight
   - You'll see: "Listening..."

2. **Speak clearly:**
   ```
   "Send 500 to Rahul"
   ```
   - Speak naturally, not robotic
   - Audio records for up to 30 seconds
   - Keep speaking until you finish

3. **Tap microphone button again to STOP recording**
   - Recording stops
   - Button shows "Processing..."
   - You'll see: "Sending to backend..."

4. **Wait for Backend to Process** (2-3 seconds)
   - Chat shows: `You said: "Send 500 to Rahul"`
   - Bot responds: `"I understood. You want to send ₹500 to Rahul"`
   - Bot speaks response aloud (TTS)

5. **Bot asks for confirmation** (after 2 seconds)
   - Chat shows: `"Do you want to send ₹500 to Rahul? Say yes or no."`
   - Bot speaks: Same question
   - **Tap microphone again**

6. **Say "Yes"** to confirm
   - You say clearly: "Yes"
   - Stop recording

7. **Expected Result: AUTO-NAVIGATE to SendMoney Screen** ✅
   - App instantly shows:
     * Amount field: ₹500
     * Recipient field: Rahul
     * UPI payment screen
   - You can now tap "Confirm" to complete payment

---

## 📊 EXPECTED CONSOLE LOGS

### **Backend Terminal (Terminal #1)** - Should show:
```
📦 Received binary audio buffer: 12345 bytes
✅ Audio received: 12345 bytes
   Attempting Deepgram transcription...
📝 Transcribed text: send 500 to rahul
✅ Transcription cost: ~0.0002 requests
🎯 Parsing text: send 500 to rahul
📦 Entities: {"amount":500,"recipient":"Rahul"}
🎯 Action: prefill_and_navigate_upi
✅ Response sent to frontend
```

### **Expo Metro Console** - Should show:
```
🎤 Recording started...
💬 Sending audio to backend...
🎯 ParseResponse: {
  "intent":"send_money",
  "entities":{"amount":500,"recipient":"Rahul"},
  "actionSuggested":"prefill_and_navigate_upi"
}
💳 Money transfer detected - asking for confirmation
✅ Found confirmation at end of text
🚀 executeAction called: prefill_and_navigate_upi
📱 Navigating to SendMoney with: {amount: 500, recipient: "Rahul"}
```

---

## 🎯 WHAT TO TEST AFTER INITIAL VOICE PAYMENT

**Try these voice commands:**

### Money Transfers
```
"Send 500 to Rahul"
"Pay 1000 rupees to John"
"Transfer 250 to Priya"
"Send 99 to Mom"
```

### Check Balance
```
"Check my balance"
"What's my account balance?"
"Show balance"
```

### Transaction History
```
"Show transaction history"
"Recent transactions"
"View history"
```

### Other Functions
```
"Scan QR code"
"Check for fraud"
"Security check"
```

---

## 🔧 TROUBLESHOOTING - COMMON ISSUES

### **Issue 1: "Cannot reach localhost:3001"**

❌ **Error:** Red message: "Connection failed: Cannot reach backend"

**Fix:**
```powershell
# In Terminal #1, verify backend is running:
# Should see: "🚀 Server listening on port 3001"

# If not running, restart:
Get-Process node | Stop-Process -Force
cd server
node simple-voice-server.js
```

---

### **Issue 2: Expo Won't Connect**

❌ **Error:** QR code scan doesn't work, or app won't load

**Fix:**
1. **Make sure phone and computer are on SAME WiFi**
   - Check phone WiFi: Settings → WiFi → Must match your computer's WiFi
   
2. **If still fails, try URL method:**
   ```
   In Expo Terminal, press 'm'
   Copy the exp://... URL
   In Expo Go app, paste URL in "Enter URL"
   ```

3. **Restart Expo:**
   ```
   Press 'Ctrl+C' in Terminal #2
   Run: npx expo start --clear
   ```

---

### **Issue 3: Voice Recording Crashes**

❌ **Error:** App crashes when tap microphone, or "Permission denied"

**Fix:**
1. **Grant microphone permission:**
   - Phone settings → Apps → KAVACH → Permissions → Microphone → Allow
   
2. **On Android:**
   - Settings → Apps → Permissions → Microphone → Find KAVACH → Allow
   
3. **On iOS:**
   - Settings → Privacy → Microphone → Make sure KAVACH is listed and enabled

---

### **Issue 4: Speech Recognition Returns Empty**

❌ **Chat shows:** "You said: " (blank text)

**Fix:**
1. **Speak louder and more clearly**
2. **Check internet connection** (needed for Deepgram)
3. **Check Deepgram key is correct** in `server/.env`
4. **Check Deepgram free tier limit** (50k requests/month):
   - Go to https://console.deepgram.com
   - Check usage

---

### **Issue 5: Navigation Doesn't Work**

❌ **Error:** Says "Processing" but doesn't navigate to SendMoney

**Fix:**
1. **Check Metro Console for errors** (look for red messages)
2. **Check if SendMoney screen exists:**
   - Open: `navigation/RootNavigator.tsx`
   - Look for: `<Stack.Screen name="SendMoney" ...`
   - If not found, it needs to be created
3. **Check screen permissions:**
   - Make sure app has all required permissions to navigate

---

### **Issue 6: Deepgram API Key Error**

❌ **Backend shows:** "Deepgram SDK load error: Invalid API key"

**Fix:**
1. **Go to:** https://console.deepgram.com
2. **Create free account** (if not done)
3. **Generate new API key**
4. **Copy full 40-character key**
5. **Edit:** `server/.env` line 11
   ```
   DEEPGRAM_API_KEY=your_new_key_here
   ```
6. **Restart backend:**
   ```
   Ctrl+C in Terminal #1
   node simple-voice-server.js
   ```

---

## 📱 FULL STARTUP CHECKLIST

Print this or screenshot to track:

```
☐ Kill old processes
☐ Start Backend (Terminal #1)
  ✓ See "✅ Deepgram SDK v4 loaded"
  ✓ See "🚀 Server listening on port 3001"
  
☐ Start Expo (Terminal #2)
  ✓ See "Metro server started"
  ✓ See press options menu
  
☐ Connect Phone (Scan QR)
  ✓ App loads on phone
  ✓ Initial screen appears
  
☐ Navigate to Voice Assistant
  ✓ Screen appears
  ✓ See "Test Connection" in green
  
☐ Test Voice Recording
  ✓ Say "Send 500 to Rahul"
  ✓ See transcription in chat
  ✓ Bot asks for confirmation
  
☐ Confirm Payment
  ✓ Say "Yes"
  ✓ Navigate to SendMoney
  ✓ Fields pre-filled (500, Rahul)
  
✅ COMPLETE - PROJECT RUNNING SUCCESSFULLY!
```

---

## ⚡ QUICK REFERENCE COMMANDS

| What | Command | Terminal |
|------|---------|----------|
| **Kill old processes** | `Get-Process node -ErrorAction SilentlyContinue \| Stop-Process -Force` | Any |
| **Start backend** | `cd server && node simple-voice-server.js` | #1 |
| **Start Expo** | `cd .. && npx expo start` | #2 |
| **Check ports** | `netstat -ano \| findstr ":3001"` | Any |
| **Connect to phone** | Press 'e' in Expo terminal | #2 |
| **Clear Expo cache** | `npx expo start --clear` | #2 |
| **View app logs** | Open Metro console | #2 |
| **Reload app on phone** | Shake phone → "Reload" | Phone |
| **Stop backend** | Ctrl+C | #1 |
| **Stop Expo** | Ctrl+C | #2 |

---

## 🎉 SUCCESS INDICATORS

### Backend Running:
```
✅ Deepgram SDK v4 loaded and ready
🔑 API Key configured: 908a9c92...
🚀 Server listening on port 3001
```

### Expo Running:
```
✓ Loaded expo config
› Metro server started on port 8081
› Press 'e' to send to your phone with Expo Go
```

### App Connected:
```
✅ App loaded on phone
✅ Voice Assistant screen visible
✅ "Test Connection" shows green ✅
```

### Voice Test Successful:
```
Chat shows: "You said: Send 500 to Rahul"
Bot responds: "Do you want to send ₹500 to Rahul?"
App navigates to SendMoney with fields filled
```

---

## 💡 USEFUL TIPS

1. **Keep both terminals open** - Backend and Expo must both run
2. **Same WiFi** - Phone and computer must be on same network
3. **Internet required** - Deepgram API needs internet connection
4. **Reload app** - If something looks wrong, shake phone and tap "Reload"
5. **Check console** - Click "Metro Console" to see detailed logs
6. **Clear cache** - If app behaves weird: `npx expo start --clear`

---

## 🎯 NEXT STEPS AFTER IT WORKS

1. **Run complete QA test suite** - 27 tests across 8 test suites
2. **Test all voice commands** - Try different amounts, names, intents
3. **Test error scenarios** - What happens if backend is offline?
4. **Optimize performance** - Check latency from voice to payment screen
5. **Deploy Phase 2** - SMS fraud detection with behavioral analysis
6. **Enable Phase 3** - MongoDB persistence and location awareness

---

**👉 Ready? Open Terminal #1 and run:** 
```powershell
cd c:\Users\DebSarkar\Desktop\KAVACH-main\server
node simple-voice-server.js
```

**Then Terminal #2:**
```powershell
cd c:\Users\DebSarkar\Desktop\KAVACH-main
npx expo start
```

**Then press 'e' on your phone! 🚀**
