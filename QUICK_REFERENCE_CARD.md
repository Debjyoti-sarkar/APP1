# 🎯 QUICK REFERENCE - YOUR SETUP

**Date**: February 21, 2026  
**Status**: ✅ FULLY CONFIGURED & READY TO TEST

---

## **YOUR MACHINE DETAILS**

```
Ethernet:   172.16.7.167 ← SELECTED ✅
Wi-Fi:      172.16.13.26 (backup)
```

---

## **QUICK START COMMAND**

Open 2 terminals and run:

```bash
# Terminal 1: Backend
cd backend
node server.js

# Terminal 2: Frontend (different terminal)
npx expo start --clear
```

Then scan QR code and test! ✅

---

## **WHAT TO EXPECT**

| When | What | Status |
|------|------|--------|
| After `node server.js` | See "🚀 KAVACH Backend Server started on port 5000" | ✅ Good |
| After `npx expo start --clear` | See "Metro bundler started on port 8081" | ✅ Good |
| Scan QR in emulator | App loads and shows login | ✅ Good |
| Go to Phone Verification | Screen appears | ✅ Good |
| Enter 7209799940 | Phone field has your number | ✅ Good |
| Click Send OTP | Console shows: "apiUrl: http://172.16.7.167:5000/api" | ✅ WORKING! |
| | Console shows: "OTP sent successfully" (no retries) | ✅ WORKING! |
| | App shows: "OTP Sent!" alert | ✅ SUCCESS! |
| SMS arrives | You get: "Your KAVACH verification code is..." | ✅ COMPLETE! |

---

## **FILES INVOLVED**

| File | Change | Status |
|------|--------|--------|
| `backend/server.js` | Listen on 0.0.0.0 | ✅ Updated |
| `config/apiConfig.ts` | PHYSICAL_DEVICE_IP = 172.16.7.167 | ✅ Updated |
| All others | No changes needed | ✅ Ready |

---

## **IF SOMETHING GOES WRONG**

| Error | Fix |
|-------|-----|
| "Port 5000 already in use" | Kill-port 5000; restart backend |
| "Cannot find module" | npm install (in respective folder) |
| "Still getting Network Error" | Try Wi-Fi IP (172.16.13.26) |
| "Metro bundler won't start" | npx expo start --clear (with --clear flag) |

---

## **SUCCESS CHECKLIST**

- [ ] Backend running on port 5000
- [ ] Expo running on port 8081
- [ ] QR code scanned in emulator
- [ ] App opened in emulator
- [ ] Phone Verification screen visible
- [ ] Phone number 7209799940 entered
- [ ] Send OTP clicked
- [ ] Expo console shows your IP (172.16.7.167)
- [ ] No network errors or retries shown
- [ ] "OTP Sent!" alert appears
- [ ] SMS arrives on phone
- [ ] 🎉 SUCCESS!

---

## **DOCUMENTS TO READ**

1. **This file** (you are here) - Quick reference
2. **FINAL_SETUP_AND_TEST.md** - Detailed steps
3. **ANDROID_EMULATOR_NETWORK_FIX.md** - If still failing

---

## **YOUR IP CONFIGURATION**

Primary: **172.16.7.167** (Ethernet)  
Backup: **172.16.13.26** (Wi-Fi)

Currently using: **172.16.7.167** ✅

Change location: `config/apiConfig.ts` line 14

---

**Ready?**

Terminal 1: `cd backend && node server.js`  
Terminal 2: `npx expo start --clear`

Go! 🚀
