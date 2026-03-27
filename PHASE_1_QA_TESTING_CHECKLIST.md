# Phase 1 QA Testing Checklist

**Project**: KAVACH Voice Assistant Phase 1 Enhancement  
**Test Date**: [To be filled by QA team]  
**Tester**: [To be filled by QA team]  
**Status**: Ready for Testing  

---

## Pre-Test Setup

- [ ] Backend server running: `node c:\...\server\simple-voice-server.js`
- [ ] Verify health endpoint: `http://localhost:3001/health` returns `{"status":"ok"}`
- [ ] Deepgram API key configured: `DEEPGRAM_API_KEY` in server/.env
- [ ] React Native app installed and running
- [ ] Network connectivity available
- [ ] Microphone permissions granted

---

## Test Suite 1: Audio Recording Basics

### Test 1.1 - Start Recording
**Expected**: Microphone button becomes active, audio capture begins  

```
Steps:
1. Open Voice Assistant screen
2. Look for blue circular microphone button
3. Tap once
4. Observe button changes to red
5. Observe status text changes to "Recording… Tap to stop"

Results:
[ ] Button changed color to red
[ ] Status text shows "Recording… Tap to stop"
[ ] Console shows "🎤 Recording started!"
[ ] No errors or warnings
```

---

### Test 1.2 - Stop Recording (Normal Flow)
**Expected**: Recording stops, audio uploads, transcription appears  

```
Steps:
1. After starting recording (Test 1.1)
2. Say clearly: "Send 500 to John"
3. Tap red microphone button to stop
4. Wait for transcription (should be 1-3 seconds)

Results:
[ ] Button changed back to blue
[ ] Status text shows "Processing audio…"
[ ] After 1-3 seconds, transcription appears
[ ] Text accuracy >= 90% (for clear speech)
[ ] Confidence score > 0.8 in console logs
[ ] No errors
```

---

### Test 1.3 - Recording Duration: OK (2 seconds)
**Expected**: Recording with proper duration processes normally  

```
Steps:
1. Tap microphone button
2. Count to 2 seconds (hold button)
3. Tap to stop
4. Wait for transcription

Results:
[ ] Recording duration logged as ~2000ms
[ ] Audio file created successfully
[ ] Transcription completes
[ ] No duration error
[ ] Confidence score > 0.8
```

---

### Test 1.4 - Recording Duration: Too Short (< 0.5 seconds)
**Expected**: Quick button press rejects recording  

```
Steps:
1. Tap microphone button
2. Immediately release (same moment)
3. Observe error message

Results:
[ ] Alert appears: "Recording Too Short"
[ ] Message has helpful text about 0.5 seconds
[ ] Button returns to blue (idle state)
[ ] No transcription attempt made
[ ] Console shows duration < 500ms
```

---

### Test 1.5 - Recording Duration: Maximum (30 seconds)
**Expected**: Recording auto-stops after 30 seconds  

```
Steps:
1. Tap microphone button
2. Continue speaking/making noise for 35 seconds
3. Observe automatic stop
4. Do NOT manually stop

Results:
[ ] Recording automatically stops at 30 seconds
[ ] Alert appears: "Recording Timeout"
[ ] Message indicates auto-stop at 30 seconds
[ ] Button returns to blue
[ ] No manual intervention required
```

---

## Test Suite 2: Network Awareness

### Test 2.1 - Network Available (Normal)
**Expected**: Recording enabled, all systems go  

```
Setup:
- WiFi or cellular active
- Normal network condition (not throttled)

Steps:
1. Open Voice Assistant screen
2. Check network status indicator (if visible)
3. Tap microphone button

Results:
[ ] Network status shows "Online" or connected
[ ] Microphone button responds immediately
[ ] Recording starts without delay
[ ] No network-related errors
```

---

### Test 2.2 - Network Unavailable (Offline)
**Expected**: Recording prevented with network error  

```
Setup:
1. Disable WiFi and cellular (airplane mode)

Steps:
1. Open Voice Assistant screen
2. Try to tap microphone button
3. Observe alert

Results:
[ ] Alert appears immediately
[ ] Message includes: "Network Issue" or similar
[ ] Message suggests typing instead
[ ] Microphone button disabled (visually)
[ ] Console shows: "📡 No network connection"
[ ] No recording attempt made
```

---

### Test 2.3 - Network Weak (Slow Connection)
**Expected**: Recording prevented with weak network warning  

```
Setup:
1. Enable WiFi but severely throttle bandwidth
   - Chrome DevTools → Network tab → Slow 3G
   - Or: Router settings → Limit bandwidth
2. Should have <1 Mbps available

Steps:
1. Open Voice Assistant screen
2. Try to tap microphone button
3. Observe alert

Results:
[ ] Alert appears: "Network Issue" or "Weak Connection"
[ ] Message suggests checking connection
[ ] Microphone button disabled
[ ] Console shows: "📡 Weak network detected"
[ ] No recording attempted
```

---

## Test Suite 3: Transcription Quality

### Test 3.1 - Clear Speech (Indoor, Quiet)
**Expected**: 95%+ accuracy transcription  

```
Setup:
- Quiet indoor environment
- Standard microphone distance (10cm)
- Normal speaking voice

Steps:
1. Tap microphone button
2. Say clearly: "Send five hundred rupees to Rahul"
3. Stop recording (tap red button)
4. Wait for transcription
5. Check console for confidence score

Results:
[ ] Transcribed text captures meaning
[ ] Accuracy >= 95% (at least 95% of words correct)
[ ] Confidence score > 0.85
[ ] Punctuation appears (smart_format working)
[ ] Text appears in chat messages
```

---

### Test 3.2 - Moderate Noise (Ambient Sound)
**Expected**: 90%+ accuracy with background noise  

```
Setup:
- Slight background noise (TV, traffic)
- Normal voice level

Steps:
1. Play background sound (video, voice)
2. Tap microphone
3. Say: "Check my account balance"
4. Stop recording

Results:
[ ] Transcription captures intent despite noise
[ ] Accuracy >= 90%
[ ] Confidence score > 0.75
[ ] No garbled text
[ ] Intent parsed correctly
```

---

### Test 3.3 - Loud Noise (Heavy Ambient)
**Expected**: 80%+ accuracy or rejection with low confidence  

```
Setup:
- Loud background noise (music, crowd)
- Higher voice volume needed

Steps:
1. Play loud audio
2. Tap microphone, speak loudly
3. Say one of: "Send money", "Check balance"
4. Stop recording

Results:
[ ] Either:
    - Transcription has 80%+ accuracy, OR
    - Low confidence alert appears
[ ] If low confidence:
    - Alert: "Please speak more clearly"
    - Suggestion to retry
[ ] No crash or hang
```

---

### Test 3.4 - Whispered Speech
**Expected**: Rejected with low confidence  

```
Setup:
- Whisper your message
- Normal distance

Steps:
1. Tap microphone
2. Whisper: "Send money to alice"
3. Stop recording
4. Observe alert

Results:
[ ] Alert appears: "Unclear Audio" or similar
[ ] Message prompts: "Speak more clearly"
[ ] Confidence score < 0.5
[ ] User not shown garbage transcription
[ ] Can retry by tapping button again
```

---

### Test 3.5 - Accent/Regional Speech
**Expected**: 90%+ accuracy maintained with accent  

```
Setup:
- Speak with accent (if available)
- Clear pronunciation but non-native accent

Steps:
1. Tap microphone
2. Speak: "Send three thousand to my friend"
3. Stop recording

Results:
[ ] Transcription captures meaning
[ ] Accepts legitimate accent variations
[ ] Accuracy >= 90% (or low confidence if not)
[ ] Punctuation included
[ ] Intent understood
```

---

## Test Suite 4: Error Handling

### Test 4.1 - Backend Offline
**Expected**: Specific error with recovery instructions  

```
Setup:
1. Stop backend server: Kill PowerShell window or `Ctrl+C`
2. Ensure port 3001 not responding

Steps:
1. Open app (if not already)
2. Record audio with clear speech
3. Tap to stop and upload
4. Observe error

Results:
[ ] Alert title: "Backend Connection Error"
[ ] Alert includes: "Cannot reach http://localhost:3001"
[ ] Suggestions numbered (1. Open PowerShell, 2. cd ..., etc.)
[ ] Step 3: "node simple-voice-server.js"
[ ] Step 4: "Should show ✅ Server listening"
[ ] Console shows: "Backend offline - cannot reach localhost:3001"
[ ] User knows exactly how to recover
```

---

### Test 4.2 - Invalid API Key
**Expected**: Auth error with configuration guidance  

```
Setup:
1. Edit server/.env
2. Change DEEPGRAM_API_KEY to fake value: "invalid_key_12345"
3. Restart backend: `node simple-voice-server.js`

Steps:
1. Record audio with clear speech
2. Tap to stop and upload
3. Observe error

Results:
[ ] Alert title: "API Configuration Error"
[ ] Message mentions: "API key invalid or expired"
[ ] Instructions mention: "Check server/.env"
[ ] Shows: "DEEPGRAM_API_KEY=your_key_here"
[ ] Console error mentions: "401" or "authentication"
[ ] User knows issue is API configuration
```

---

### Test 4.3 - Rate Limit (API Quota)
**Expected**: Rate limit error with wait time  

```
Setup:
1. (Optional: requires many rapid calls)
2. Make 100+ transcription requests in 1 minute
3. Deepgram free tier limit: 100 req/min

Steps:
1. After exceeding limit, try to record again
2. Upload audio and observe response

Results:
[ ] Alert appears: "Rate Limit Exceeded"
[ ] Message includes: "Too many requests"
[ ] Suggests: "Wait 10 seconds"
[ ] Console shows: 429 error code
[ ] User knows to retry later
```

---

### Test 4.4 - Microphone Permission Denied
**Expected**: Permission error with guidance  

```
Setup:
1. Revoke microphone permission in OS/App settings

Steps:
1. Open app
2. Try to tap microphone button

Results:
[ ] Alert appears: "Microphone Permission Required"
[ ] Message: "Enable microphone permission in settings"
[ ] Doesn't proceed with recording
[ ] User knows where to fix issue
```

---

## Test Suite 5: Voice Processing Flow

### Test 5.1 - Voice to Text to Intent
**Expected**: Complete flow from speech to command parsing  

```
Steps:
1. Tap microphone
2. Say: "Send 500 rupees to Priya"
3. Stop recording
4. Wait for processing (should be quick)

Results:
[ ] Transcription appears: "send 500 rupees to priya"
[ ] Intent parsed: should recognize "send_money"
[ ] Amount extracted: "500"
[ ] Recipient identified: "priya"
[ ] Result shown in chat:
    "Okay, sending ₹500 to Priya. Say yes to confirm or no to cancel."
[ ] Voice response plays (TTS)
[ ] No errors or warnings
```

---

### Test 5.2 - Voice Command Variations
**Expected**: Intent parsing works for different phrasings  

```
Steps (repeat for each):
1. "Pay 250 to mom"
2. "Transfer 1000 rupees to dad"
3. "Check my balance"
4. "Show transaction history"
5. "Scan message for fraud"

Results:
[ ] Each command recognized correctly
[ ] Appropriate intent assigned
[ ] Correct action suggested
[ ] Clear voice response given
[ ] No false positives
[ ] No crashes
```

---

## Test Suite 6: Performance

### Test 6.1 - Recording Latency
**Expected**: Recording starts < 200ms after button press  

```
Measurement:
1. Monitor: Time from button press to audio capture start (in logs)
2. Expected: < 200ms

Process:
1. Watch browser console for timestamps
2. Note time of button press
3. Note console shows "🎤 Recording started!"
4. Calculate latency

Results:
[ ] Latency < 200ms
[ ] No delay or freezing felt
[ ] Button UI feedback immediate
```

---

### Test 6.2 - Transcription Latency
**Expected**: Deepgram processing 1-3 seconds  

```
Measurement:
1. Record 5-second audio
2. Time from upload to transcription result

Timing:
- < 1 second: Excellent
- 1-3 seconds: Good (expected)
- > 5 seconds: Investigate

Results:
[ ] Typical time: 1-3 seconds
[ ] Consistent across multiple attempts
[ ] Longer audio takes proportionally more time
```

---

### Test 6.3 - Memory Usage
**Expected**: <15MB during recording, returns to baseline after  

```
Measurement (if available):
1. Monitor system memory before recording
2. Record 10-second audio
3. Monitor memory during
4. Monitor memory after cleanup

Results:
[ ] Peak memory < 15MB above baseline
[ ] Memory returns within 10MB of baseline after cleanup
[ ] No memory leaks (memory doesn't keep growing)
```

---

## Test Suite 7: Stress & Stability

### Test 7.1 - Rapid Start/Stop Cycles
**Expected**: Multiple quick record-stop cycles without crash  

```
Steps:
1. Rapidly tap button on/off 10 times
2. Each time: press, release quickly
3. Monitor for crashes or errors

Results:
[ ] No crash or hang
[ ] All buttons respond
[ ] No "Only one Recording" errors
[ ] App remains responsive
[ ] Each cycle completes cleanly
```

---

### Test 7.2 - App Background/Resume
**Expected**: Graceful handling when app goes to background  

```
Steps:
1. Start recording
2. Lock phone or switch to another app (app goes background)
3. Wait 5 seconds
4. Switch back to app

Results:
[ ] Recording automatically stopped
[ ] No error on resume
[ ] Can record again immediately
[ ] No resource leaks
[ ] Status shows idle (not stuck recording)
```

---

### Test 7.3 - Network Change During Recording
**Expected**: Graceful degradation or error  

```
Setup:
Start recording on WiFi, then switch to cellular (or vice versa)

Steps:
1. Tap microphone (WiFi active)
2. Speak for 3 seconds
3. Switch networks (disable WiFi, enable cellular)
4. Finish speaking
5. Stop recording
6. Observe what happens

Results:
[ ] Either: Completes successfully, OR
[ ] Clear error about network change
[ ] No crash or hang
[ ] Can retry after network stabilizes
```

---

## Test Suite 8: Logging & Debugging

### Test 8.1 - Console Logs Present
**Expected**: Detailed logs for debugging  

```
Check Frontend (React Native console):
```
📡 Checking network connectivity...
📡 Network ready
🎤 Recording started!
🎤 Recording duration: 2341ms
📝 Transcribed text: "send 500 to john"
📊 Confidence score: 92.5%
✨ Audio cleanup complete
```

Check Backend (Node.js console):
```
📦 Received binary audio buffer: 84291 bytes
🎤 Calling Deepgram Nova-2 model...
✅ Transcription result: "send 500 to john"
📊 Confidence score: 92.5%
```

Results:
[ ] All expected logs present
[ ] Timestamps visible
[ ] No console errors
[ ] Easy to follow execution flow
```

---

### Test 8.2 - Error Log Classification
**Expected**: Each error type classified  

```
Trigger different errors and check console for:

BACKEND_OFFLINE error should show:
[ ] Error code: "BACKEND_OFFLINE"
[ ] Message: "Connection failed"
[ ] Suggestion in alert about restarting

RATE_LIMITED error should show:
[ ] Error code: "RATE_LIMITED"
[ ] Message: "Too many requests"
[ ] Wait suggestion

Results:
[ ] Each error has proper classification
[ ] Console marks with 📋 classification line
[ ] Human-readable classification names used
```

---

## Test Summary Form

**Date Tested**: ______________  
**Tester Name**: ______________  
**Device**: ______________  
**OS Version**: ______________  
**Build Number**: ______________  

### Overall Results

**Test Suites Completed**:
- [ ] Suite 1: Audio Recording Basics (5 tests)
- [ ] Suite 2: Network Awareness (3 tests)
- [ ] Suite 3: Transcription Quality (5 tests)
- [ ] Suite 4: Error Handling (4 tests)
- [ ] Suite 5: Voice Processing Flow (2 tests)
- [ ] Suite 6: Performance (3 tests)
- [ ] Suite 7: Stress & Stability (3 tests)
- [ ] Suite 8: Logging & Debugging (2 tests)

**Total Tests**: 27  
**Tests Passed**: _____ / 27  
**Tests Failed**: _____ / 27  
**Tests Skipped**: _____ / 27  

### Issues Found

#### Critical Issues (Blocks Release)
1. [ ] Issue: ________________
   Description: ________________________
   Severity: CRITICAL
   Steps to Reproduce: ________________________

#### High Priority Issues (Should Fix)
1. [ ] Issue: ________________
   Description: ________________________
   Severity: HIGH

#### Medium Priority Issues (Nice to Have)
1. [ ] Issue: ________________
   Description: ________________________
   Severity: MEDIUM

#### Low Priority Issues (Future)
1. [ ] Issue: ________________
   Description: ________________________
   Severity: LOW

### Recommendations

- [ ] Recommend production release (if all tests pass)
- [ ] Recommend further testing (if minor issues found)
- [ ] Do NOT release (if critical issues found)

**Comments**: _______________________________________________________________________________

---

**Tester Signature**: ________________  
**Date**: ________________  

---

**Phase 1 Testing Complete** ✅

Once all tests pass, the system is ready for:
- [ ] User acceptance testing (UAT)
- [ ] Production deployment
- [ ] Phase 2 development (Advanced Fraud Detection)

