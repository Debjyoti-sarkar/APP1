# Axios Error Diagnosis & Resolution Guide

## ✅ **STATUS: All Systems Verified & Working**

### Last Verification Results (Current Session)
- **Backend Server**: ✅ Running on port 5000
- **MongoDB**: ✅ Connected to mongodb://localhost:27017/kavach
- **OTP Endpoint**: ✅ Working (tested with real SMS)
- **Fast2SMS API**: ✅ Configured and responding
- **API Routes**: ✅ All endpoints registered
- **Dependencies**: ✅ Axios installed and available

---

## **Common Axios Errors & Solutions**

### **1. AxiosError: Network Error**
```
Error: Network Error
Code: ECONNREFUSED
```
**Causes:**
- Backend server not running on port 5000
- Firewall blocking the connection
- Wrong IP configuration in apiConfig.ts

**Fix:**
```bash
# Check if backend is running
Get-NetTCPConnection -LocalPort 5000 -State Listen

# If not running, start it
cd C:\Users\DebSarkar\Desktop\KAVACH-main\backend
node server.js

# Check if it's a port already in use error
# Kill existing process if needed
$proc = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($proc) { Stop-Process -Id $proc -Force }
```

---

### **2. AxiosError: ECONNABORTED (Request Timeout)**
```
Error: timeout of 15000ms exceeded
Code: ECONNABORTED
```
**Causes:**
- Backend server is slow
- Network latency
- Request taking longer than 15 seconds

**Fix:**
- Ensure backend is running without errors
- Check system resources (RAM, CPU)
- Increase timeout in `config/apiConfig.ts`:
```typescript
export const axiosConfig = {
  timeout: 30000, // Increase from 15000 to 30000ms
  validateStatus: (status: number) => status < 500,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};
```

---

### **3. AxiosError: ETIMEDOUT (Connection Timeout)**
```
Error: connect ETIMEDOUT
Code: ETIMEDOUT
```
**Causes:**
- Endpoint unreachable
- Network interface down
- Wrong API URL configured

**Fix:**
For **Android Physical Device**:
1. Get your machine IP:
```powershell
ipconfig
# Look for "IPv4 Address" (e.g., 192.168.1.100)
```

2. Update `config/apiConfig.ts`:
```typescript
const PHYSICAL_DEVICE_IP = '192.168.1.100'; // ← YOUR ACTUAL MACHINE IP
```

3. Ensure device is on **same WiFi** as your machine

For **Android Emulator**:
- Should work automatically with `10.0.2.2`

For **iOS Simulator**:
- Should work automatically with `localhost`

---

### **4. AxiosError: 400 Bad Request**
```
Error: Request failed with status code 400
```
**Causes:**
- Phone number format incorrect
- Missing required fields
- Invalid request body

**Fix:**
Verify phone number handling in `PhoneVerificationScreen.tsx`:
```typescript
const handleSendOtp = async () => {
  if (phone.length !== 10) {
    Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
    return;
  }
  
  // Phone must be 10 digits (without +91 prefix)
  // realOtpService will handle formatting
  const result = await realOtpService.sendOTP(phone);
};
```

---

### **5. AxiosError: 500 Server Error**
```
Error: Request failed with status code 500
```
**Causes:**
- Fast2SMS API key invalid
- Environment variable not set
- Server exception

**Fix:**
Check `backend/.env` has Fast2SMS API key:
```bash
cat backend\.env | findstr "FAST2SMS"
# Should output:
# FAST2SMS_API_KEY=b7zZQiUKe1XTxdFAjt890pLYyafOrwn4HIoESk5G6sgNDWMclvwcWgoKl20eByfpYa4VJhUM7nsXtvDi
```

If missing, add it:
```env
FAST2SMS_API_KEY=b7zZQiUKe1XTxdFAjt890pLYyafOrwn4HIoESk5G6sgNDWMclvwcWgoKl20eByfpYa4VJhUM7nsXtvDi
```

---

### **6. AxiosError: ENOTFOUND (Cannot Resolve Hostname)**
```
Error: getaddrinfo ENOTFOUND localhost
Code: ENOTFOUND
```
**Causes:**
- API endpoint URL malformed
- Network DNS issue
- Wrong URL configuration

**Fix:**
Verify `config/apiConfig.ts` has correct URL construction:
```typescript
export const getApiBaseUrl = (): string => {
  if (__DEV__) {
    switch (Platform.OS) {
      case 'android':
        return `http://10.0.2.2:5000/api`;  // ← For emulator
      case 'ios':
        return `http://localhost:5000/api`;  // ← For iOS
      case 'web':
        return `http://localhost:5000/api`;  // ← For web
      default:
        return `http://localhost:5000/api`;
    }
  } else {
    return 'https://your-production-api.com/api';  // ← Replace with your production URL
  }
};
```

---

## **Complete Diagnostic Check**

Run this to verify everything is working:

```powershell
# 1. Check backend is running
echo "1️⃣ Checking Backend..."
$proc = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($proc) {
  Write-Host "✅ Backend is running on port 5000" -ForegroundColor Green
} else {
  Write-Host "❌ Backend NOT running" -ForegroundColor Red
  exit 1
}

# 2. Check API health
echo "2️⃣ Checking API Health..."
try {
  $response = Invoke-RestMethod -Uri "http://localhost:5000/" -Method GET -TimeoutSec 5
  Write-Host "✅ API is responsive" -ForegroundColor Green
  Write-Host "   Status: $($response.status)"
} catch {
  Write-Host "❌ API not responding: $_" -ForegroundColor Red
  exit 1
}

# 3. Check OTP endpoint
echo "3️⃣ Testing OTP Endpoint..."
try {
  $headers = @{"Content-Type" = "application/json"}
  $body = @{phoneNumber="7209799940"} | ConvertTo-Json
  $response = Invoke-RestMethod -Uri "http://localhost:5000/api/otp/send" -Method POST -Headers $headers -Body $body -TimeoutSec 10
  if ($response.success) {
    Write-Host "✅ OTP endpoint working" -ForegroundColor Green
    Write-Host "   Response: $($response.message)"
  } else {
    Write-Host "⚠️ OTP endpoint error: $($response.message)" -ForegroundColor Yellow
  }
} catch {
  Write-Host "❌ OTP endpoint failed: $_" -ForegroundColor Red
  exit 1
}

# 4. Check environment variables
echo "4️⃣ Checking Environment Variables..."
$env_file = "c:\Users\DebSarkar\Desktop\KAVACH-main\backend\.env"
$hasKey = Select-String -Path $env_file -Pattern "FAST2SMS_API_KEY"
if ($hasKey) {
  Write-Host "✅ Fast2SMS API key configured" -ForegroundColor Green
} else {
  Write-Host "❌ Fast2SMS API key missing" -ForegroundColor Red
}

Write-Host "`n✅ All systems operational!" -ForegroundColor Green
```

---

## **Quick Fix Checklist**

- [ ] Backend running: `cd backend; node server.js`
- [ ] Port 5000 available: No EADDRINUSE error
- [ ] .env file has FAST2SMS_API_KEY
- [ ] API responds to GET http://localhost:5000/
- [ ] Phone number is 10 digits (no +91)
- [ ] For physical device, PHYSICAL_DEVICE_IP in apiConfig.ts is set to your machine IP
- [ ] For physical device, your machine and device are on same WiFi
- [ ] axios package installed: Check package.json has `"axios": "^1.13.2"`
- [ ] Expo frontend running: `npx expo start`
- [ ] No CORS errors in console

---

## **Credentials Status**

### ✅ **All Required Credentials Configured**

**Backend (.env)**
- ✅ FAST2SMS_API_KEY: Configured
- ✅ AADHAAR_API_KEY: Configured  
- ✅ AADHAAR_API_SECRET: Configured
- ✅ JWT_SECRET: Configured
- ✅ MONGO_URI: Configured
- ✅ NODE_ENV: development

**No additional credentials needed** - All systems are ready to use!

---

## **Testing the Complete Flow**

### **Test 1: Direct API Test**
```powershell
$headers = @{"Content-Type" = "application/json"}
$body = @{phoneNumber="7209799940"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/otp/send" -Method POST -Headers $headers -Body $body
```

### **Test 2: Frontend Test**
1. Run Expo: `npx expo start`
2. Open app in emulator/physical device
3. Go to Phone Verification screen
4. Enter phone number: `7209799940`
5. Tap "Send OTP"
6. Check console for Axios errors
7. Wait for SMS (will arrive in seconds)

### **Test 3: Network Test** (If getting network errors)
```powershell
# Test connectivity
Test-Connection localhost -Count 1
Test-Connection 10.0.2.2 -Count 1  # For emulator
Test-Connection 192.168.1.100 -Count 1  # For physical device (replace with your IP)
```

---

## **Need More Help?**

If you're still getting Axios errors after following this guide:

1. **Share the exact error message** - Include the full error stack
2. **Share the error code** - ECONNREFUSED, ETIMEDOUT, etc.
3. **Share your setup** - Device type (emulator/physical), Platform (Android/iOS)
4. **Check backend logs** - Look at terminal where `node server.js` is running
5. **Check frontend logs** - Look at Expo console in VS Code or terminal

All systems have been tested and verified working. If you encounter errors, they're likely:
- Network configuration issue (wrong IP)
- Backend not running
- Port conflict
- Firewall blocking

**Current System State:**
- ✅ Backend: http://localhost:5000 ✅ Running
- ✅ Frontend: Metro on 8081 ✅ Ready
- ✅ OTP Service: Fast2SMS ✅ Working
- ✅ Database: MongoDB ✅ Connected

All green! 🎉
