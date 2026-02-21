# 🚨 AXIOS ERROR QUICK FIX GUIDE

## Common Errors & Immediate Solutions

---

## **1. Network Error: ECONNREFUSED**

### What You See
```
AxiosError: Network Error
Error: connect ECONNREFUSED 127.0.0.1:5000
Code: ECONNREFUSED
```

### Why It Happens
Backend server is NOT running on port 5000

### Fix (30 seconds)
```powershell
# Option 1: Start backend
cd C:\Users\DebSarkar\Desktop\KAVACH-main\backend
node server.js

# Option 2: If port is in use
kill-port 5000
# Then start backend again
```

### Verify
```powershell
# Should see this output:
# 🚀 KAVACH Backend Server started on port 5000
```

---

## **2. Network Error: ETIMEDOUT**

### What You See
```
AxiosError: timeout of 15000ms exceeded
Code: ETIMEDOUT
```

### Why It Happens
Backend is slow, network is slow, or request taking too long

### Fix
```typescript
// Option 1: Increase timeout in config/apiConfig.ts
export const axiosConfig = {
  timeout: 30000, // Change from 15000 to 30000
  validateStatus: (status: number) => status < 500,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Option 2: Check backend performance
# Make sure backend is not hanging
# Restart backend fresh
```

### Verify
```powershell
# Test OTP endpoint directly
$body = @{phoneNumber="7209799940"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/otp/send" `
  -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
# Should respond within 5 seconds
```

---

## **3. Network Error: EADDRINUSE**

### What You See
```
Error: listen EADDRINUSE: address already in use :::5000
```

### Why It Happens
Another process is already using port 5000

### Fix (Immediate)
```powershell
# Kill all processes on port 5000
kill-port 5000

# Then start backend again
cd backend
node server.js
```

### Verify
```powershell
# Should show:
# 🚀 KAVACH Backend Server started on port 5000
```

---

## **4. HTTP Error: 400 Bad Request**

### What You See
```
AxiosError: Request failed with status code 400
Response: {success: false, message: "Phone number is required"}
```

### Why It Happens
Phone number not provided or wrong format

### Fix (In Your Code)
```typescript
// In PhoneVerificationScreen.tsx, line 51
const handleSendOtp = async () => {
  // Must be exactly 10 digits
  if (phone.length !== 10) {
    Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
    return;
  }
  
  // Correct format: "7209799940" (no +91 prefix)
  const result = await realOtpService.sendOTP(phone);
};
```

### Verify in App
```
Phone Input: 7209799940 ✅ (10 digits)
Phone Input: +917209799940 ❌ (has country code)
Phone Input: 720979994 ❌ (only 9 digits)
```

---

## **5. HTTP Error: 500 Server Error**

### What You See
```
AxiosError: Request failed with status code 500
Response: {success: false, message: "Internal Server Error"}
```

### Why It Happens
Usually missing API key in `.env` file

### Fix (5 minutes)
```bash
# 1. Check .env file
cat backend\.env | findstr "FAST2SMS"

# Should output:
# FAST2SMS_API_KEY=b7zZQiUKe1XTxdFAjt890pLYyafOrwn4HIoESk5G6sgNDWMclvwcWgoKl20eByfpYa4VJhUM7nsXtvDi

# 2. If missing, add to backend\.env
FAST2SMS_API_KEY=b7zZQiUKe1XTxdFAjt890pLYyafOrwn4HIoESk5G6sgNDWMclvwcWgoKl20eByfpYa4VJhUM7nsXtvDi

# 3. Restart backend
```

### Verify
```powershell
$body = @{phoneNumber="7209799940"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/otp/send" `
  -Method POST -ContentType "application/json" -Body $body

# Should show success response, not 500 error
```

---

## **6. Network Error: Cannot Reach (Physical Device)**

### What You See
```
AxiosError: Network Error
Error: connect ECONNREFUSED (on physical Android/iOS device)
```

### Why It Happens
Physical device doesn't know how to reach `10.0.2.2` or `localhost`

### Fix (5-10 minutes)

**Step 1: Get Your Machine IP**
```powershell
# Run this command
ipconfig

# Look for "IPv4 Address" like:
# Example: 192.168.1.100
```

**Step 2: Update Config**
```typescript
// File: config/apiConfig.ts, Line 14

// OLD:
const PHYSICAL_DEVICE_IP = '192.168.1.100';

// NEW: Replace with your actual IP from ipconfig
const PHYSICAL_DEVICE_IP = '192.168.1.XXX'; // Your IP here
```

**Step 3: Ensure Same WiFi**
- Your Machine: Connected to your WiFi network
- Physical Device: Connected to **SAME** WiFi network
- Both should be on same network subnet

**Step 4: Restart App**
- Close app completely
- Restart app
- Test OTP again

### Verify
```bash
# Your machine IP is like: 192.168.1.100
# Then update config/apiConfig.ts
const PHYSICAL_DEVICE_IP = '192.168.1.100';

# Device should now reach http://192.168.1.100:5000/api
```

---

## **7. "Cannot find module 'axios'"**

### What You See
```
Error: Cannot find module 'axios'
```

### Why It Happens
axios not installed in frontend or backend

### Fix (2 minutes)

**For Backend:**
```bash
cd backend
npm install axios
# or
cd backend
npm install
```

**For Frontend:**
```bash
npm install axios
# or
npm install
```

### Verify
```bash
# Check package.json has axios
cat package.json | findstr "axios"
# Should output something like:
# "axios": "^1.13.2",
```

---

## **8. Fast2SMS Not Sending SMS**

### What You See
```
OTP endpoint returns success but SMS never arrives
Response: {success: true, message: "OTP sent..."}
SMS: (Never arrives)
```

### Why It Happens
1. Fast2SMS API key is wrong
2. Fast2SMS account out of balance
3. Phone number format wrong

### Fix

**Step 1: Verify API Key**
```bash
# Check in backend/.env
cat backend\.env | findstr "FAST2SMS_API_KEY"

# Should be:
# FAST2SMS_API_KEY=b7zZQiUKe1XTxdFAjt890pLYyafOrwn4HIoESk5G6sgNDWMclvwcWgoKl20eByfpYa4VJhUM7nsXtvDi
```

**Step 2: Verify Phone Number Format**
```typescript
// Should be formatted as:
const phoneNumber = "7209799940"; // 10 digits, no +91

// Backend will convert to:
cleanPhone = "917209799940"; // Adds country code 91
```

**Step 3: Check Fast2SMS Account**
- Log in to Fast2SMS dashboard
- Check account balance
- Check API settings
- Verify API key is active

**Step 4: Test with curl**
```bash
curl -X POST https://www.fast2sms.com/dev/bulkV2 \
  -H "authorization: YOUR_API_KEY" \
  -d "route=q&message=Test&numbers=917209799940"
```

---

## **9. Expo App Crashes on Startup**

### What You See
```
Error: Cannot find module '@react-native-async-storage/async-storage'
```

### Why It Happens
Dependencies not installed or outdated

### Fix (2 minutes)
```bash
# Clear everything
rm -r node_modules
rm -r .expo

# Reinstall
npm install

# Start Expo fresh
npx expo start --clear
```

### Verify
```bash
# Check package.json has all dependencies
cat package.json | findstr "async-storage"
# Should output:
# "@react-native-async-storage/async-storage": "^2.2.0",
```

---

## **10. "OTP_BYPASS_ENABLED is not defined"**

### What You See
```
RuntimeError: OTP_BYPASS_ENABLED is not defined
```

### Why It Happens
Old code referencing removed constant

### Fix
```typescript
// Remove these lines from PhoneVerificationScreen.tsx
// OLD CODE - REMOVE:
if (OTP_BYPASS_ENABLED) {
  // bypass code
}

// NEW CODE - Already implemented:
// Use realOtpService.sendOTP() directly
const result = await realOtpService.sendOTP(phone);
```

---

## **DIAGNOSTIC CHECKLIST**

Before debugging, check these:

```bash
# 1. Backend running?
Get-NetTCPConnection -LocalPort 5000 -State Listen
# Should show a process

# 2. API responding?
Invoke-RestMethod http://localhost:5000
# Should return JSON response

# 3. OTP endpoint working?
$body = @{phoneNumber="7209799940"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/otp/send" `
  -Method POST -ContentType "application/json" -Body $body
# Should return {success: true}

# 4. .env file exists?
Test-Path backend\.env
# Should return True

# 5. FAST2SMS_API_KEY set?
cat backend\.env | findstr "FAST2SMS_API_KEY"
# Should show API key

# 6. Dependencies installed?
Test-Path node_modules
# Should return True
```

---

## **QUICK FIX COMMAND REFERENCE**

```powershell
# Clear ports and restart everything
kill-port 5000
kill-port 8081
cd backend
node server.js

# In another terminal
npx expo start --clear

# Run diagnostics
powershell -ExecutionPolicy Bypass -File ".\quick-diagnose.ps1"

# Check backend health
Invoke-RestMethod http://localhost:5000

# Test OTP endpoint
$body = @{phoneNumber="7209799940"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/otp/send" `
  -Method POST -ContentType "application/json" -Body $body
```

---

## **IF NOTHING ABOVE WORKS**

1. **Collect error information:**
   ```powershell
   # Run diagnostics and save output
   powershell -ExecutionPolicy Bypass -File ".\quick-diagnose.ps1" > diagnostic_output.txt
   ```

2. **Share:**
   - Full error message
   - Error code (ECONNREFUSED, ETIMEDOUT, etc.)
   - Your platform (Android/iOS/Web)
   - Device type (emulator/physical)
   - Diagnostic output file

3. **Reference:**
   - [AXIOS_ERROR_DIAGNOSIS.md](./AXIOS_ERROR_DIAGNOSIS.md)
   - [AXIOS_RESOLUTION_SUMMARY.md](./AXIOS_RESOLUTION_SUMMARY.md)
   - [AXIOS_RESOLUTION_FINAL.md](./AXIOS_RESOLUTION_FINAL.md)

---

**Remember:** 99% of Axios errors are either:
1. Backend not running → Start it
2. Wrong IP configured → Update config/apiConfig.ts
3. Wrong phone format → Use 10 digits
4. Missing API key → Check backend/.env

**You've got this! 💪**
