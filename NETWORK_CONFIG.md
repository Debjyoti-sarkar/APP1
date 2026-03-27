# Network Configuration Guide

If you're getting **"Network Error" or "ECONNREFUSED"** errors when testing OTP:

## For Android Emulator
✅ Works automatically with `10.0.2.2:5000`

## For Physical Android Device

### Step 1: Find Your Machine IP
**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter (e.g., `192.168.x.x`)

**Mac/Linux:**
```bash
ifconfig
```
Look for `inet` address under your WiFi interface

### Step 2: Update Configuration
Edit `config/apiConfig.ts`:
```typescript
// Line 18-19: Replace this
const PHYSICAL_DEVICE_IP = '192.168.1.100'; // ← Update with YOUR machine IP
```

Replace `192.168.1.100` with your actual machine IP from Step 1.

### Step 3: Enable Backend on Network
Make sure your backend is accessible from other devices on the network. Edit if needed:

**Backend might need to listen on 0.0.0.0 instead of localhost:**
```javascript
app.listen(PORT, '0.0.0.0', () => {
  // Now accessible from other devices
});
```

### Step 4: Connect Device to Same Network
✅ Ensure physical device is on **same WiFi network** as your machine

### Step 5: Test Connection
On your machine, test if backend is accessible:
```powershell
Invoke-RestMethod -Uri "http://192.168.1.100:5000/" -Method GET
```

## For iOS Simulator / Real iPhone
Use `localhost:5000` (works out of the box)

## Debugging Network Issues

The app will now show detailed logs:
```
📊 Network Info: { platform: 'android', apiUrl: 'http://10.0.2.2:5000/api', ... }
📡 Using API endpoint: http://10.0.2.2:5000/api
📱 Platform: android
📱 Sending real SMS OTP to: 7209799940
```

Common errors and solutions:
- ❌ `ECONNREFUSED` → Backend not running, check port 5000
- ❌ `Network Error` → Device can't reach backend IP, check config/apiConfig.ts
- ❌ `ETIMEDOUT` → Backend is slow or on different network, check WiFi
- ⚠️ `PHYSICAL_DEVICE_IP not configured` → Update config/apiConfig.ts with your IP

## Testing Backend API Directly

```powershell
# Test if backend is running
Invoke-RestMethod -Uri "http://localhost:5000/" -Method GET

# Test OTP endpoint
$body = @{phoneNumber="7209799940"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://10.0.2.2:5000/api/otp/send" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

## SSL/HTTPS & Android

If you need HTTPS with SSL certificates:
1. **Development**: Use HTTP (this app does)
2. **Production**: Configure HTTPS in config/apiConfig.ts

No SHA fingerprint needed with current HTTP setup.

## Still Having Issues?

Check the console logs for:
- Platform type being detected
- Which API endpoint is being used  
- Exact error code and message
- Network info being logged
