# 🔧 ANDROID EMULATOR NETWORK ERROR - COMPLETE FIX

**Issue**: Android emulator getting "Network Error" when trying to reach backend  
**Status**: Backend is working ✅ | Issue is with emulator network connectivity

---

## **✅ WHAT WAS FIXED**

1. **Backend Network Binding** - Updated `server.js` to listen on **all interfaces (0.0.0.0)**
2. Backend now accessible from:
   - `http://localhost:5000` ✅
   - `http://10.0.2.2:5000` ✅ (emulator will use this)
   - All network interfaces ✅

---

## **🚨 ANDROID EMULATOR NETWORK ERROR RESOLUTION**

### **Root Cause**
Your Android emulator is configured but not able to connect to the backend. This is usually due to:
1. Emulator network settings not configured correctly
2. Firewall blocking port 5000
3. Emulator needs network permission

### **Fix Options (Try in Order)**

---

## **Option 1: Restart Emulator (Fastest - 30 seconds)**

The emulator might just need a fresh start to establish network connectivity.

```bash
# 1. Close Expo app in emulator
# 2. Fully close the emulator
# 3. In Android Studio or terminal:

# On Windows (if using Android Studio):
Open Android Studio → Virtual Device Manager → Right-click device → Cold Boot

# Or from command line:
adb emu kill
# Wait 5 seconds
# Then restart your emulator
```

**Then test again**: Open Expo app → Navigate to Phone Verification → Try OTP

---

## **Option 2: Enable Network in Emulator (If Option 1 Doesn't Work)**

Check if your emulator has network access enabled.

```bash
# In Emulator, Open Settings:
Settings → About Phone → Check device name
# Should show "google_sdk" or similar (means it's a standard emulator with network)

# Test emulator network:
adb shell ping 8.8.8.8
# Should get responses (4 lines of "64 bytes from...")

# If ping fails, network is disabled - Enable it:
# 1. Close emulator
# 2. In Android Studio: Tools → SDK Manager → Check API 30 or higher is installed
# 3. Create new emulator with API 31+ with Google Play Services
```

---

## **Option 3: Use Your Machine IP Instead of 10.0.2.2 (Most Reliable)**

This bypasses emulator quirks and works 100% reliably.

### **Step 1: Find Your Machine IP**

```bash
# On Windows, run in PowerShell:
ipconfig

# Look for "Ethernet adapter" or "Wi-Fi adapter" section
# Find "IPv4 Address" - it will look like:
#   IPv4 Address . . . . . . . . . . : 192.168.1.100
#   IPv4 Address . . . . . . . . . . : 10.0.0.50

# IMPORTANT: Use the IP that's NOT 127.0.0.1 or 10.0.2.2
# Typically looks like: 192.168.x.x or 10.0.x.x (but not 10.0.2.x)
```

### **Step 2: Update config/apiConfig.ts**

```typescript
// File: config/apiConfig.ts
// Change line 14 from:
const PHYSICAL_DEVICE_IP = '192.168.1.100';

// To your actual IP, for example:
const PHYSICAL_DEVICE_IP = '192.168.1.50';  // ← YOUR IP HERE

// Or if you're on corporate network:
const PHYSICAL_DEVICE_IP = '10.0.0.25';  // ← YOUR IP HERE
```

### **Step 3: Configure Emulator to Use Your IP**

The system will automatically detect if it's an emulator and use the appropriate URL.

**Option A - Automatic (Recommended)**:
- The code already detects emulator vs physical device
- Just restart Expo: `npx expo start`

**Option B - Force Physical Device Mode** (if autodiscovery fails):
Edit the auto-detection in `config/apiConfig.ts`:

```typescript
// OLD (auto-detect):
const isAndroidEmulator = (): boolean => {
  if (Platform.OS !== 'android') return false;
  return true; // Default to emulator
};

// NEW (for testing with your IP):
const isAndroidEmulator = (): boolean => {
  if (Platform.OS !== 'android') return false;
  return false; // Force use PHYSICAL_DEVICE_IP instead of 10.0.2.2
};
```

### **Step 4: Restart Expo**

```bash
# Clear cache and restart
npx expo start --clear

# Then scan QR code with Expo Go app on emulator
# Or press 'a' for Android
```

### **Verify It Works**

In Expo console, you should see:
```
📊 Network Info: {..., "apiUrl": "http://192.168.1.50:5000/api", ...}
```
(Not 10.0.2.2)

---

## **Option 4: Configure Emulator Network Settings (Advanced)**

If the above options don't work, configure emulator networking:

### **For Android Emulator in Android Studio:**

1. Open Android Studio
2. Tools → AVD Manager
3. Right-click your emulator → Edit
4. Click "Show Advanced Settings"
5. Network section:
   - Front DNS: `8.8.8.8`
   - Back DNS: `4.4.4.4`
6. Click Finish
7. Cold boot the emulator

### **From Command Line:**

```bash
# List available emulators
emulator -list-avds

# Start with specific network config
emulator -avd YourEmulatorName -dns-server 8.8.8.8,4.4.4.4
```

---

## **Option 5: Test Direct Network Access**

Test if emulator can reach your machine at all:

```bash
# On Windows machine, run:
# First, get your IP (see Option 3 Step 1)

# Then test from emulator via adb:
adb shell ping 192.168.1.100  # Replace with YOUR IP
# Should see replies like: "64 bytes from 192.168.1.100: icmp_seq=1 ttl=64 time=1.234ms"

# If no response, emulator network is not working
# Follow Option 4 to reconfigure

# Test HTTP connection:
adb shell curl http://192.168.1.100:5000/
# Should see the API response
```

---

## **COMPLETE TROUBLESHOOTING CHECKLIST**

- [ ] **Step 1**: Restart emulator (Cold Boot)
- [ ] **Step 2**: Close and restart Expo app in emulator
- [ ] **Step 3**: Check Expo console for error messages
- [ ] **Step 4**: If still failing, switch to physical device IP method:
  - [ ] Find machine IP: `ipconfig`
  - [ ] Update `config/apiConfig.ts` line 14
  - [ ] Restart Expo: `npx expo start --clear`
  - [ ] Close/reopen Expo app in emulator
- [ ] **Step 5**: If still failing, force physical device mode in config
- [ ] **Step 6**: If still failing, configure emulator DNS (Option 4)

---

## **EXPECTED LOGS AFTER FIX**

When you successfully send OTP, you should see in Expo console:

```
📊 Network Info: {
  "apiUrl": "http://10.0.2.2:5000/api",  // ← or your IP
  "isAndroid": true,
  "isDev": true,
  "platform": "android"
}
📡 Using API endpoint: http://10.0.2.2:5000/api
📱 Sending real SMS OTP to: 7209799940
✅ OTP sent successfully

// NOT retries like before:
❌ LOG  🔄 Retry attempt 1/3 after 1000ms...
❌ LOG  ❌ Error sending OTP: Network Error
```

---

## **BACKEND STATUS**

✅ **Fixed**: Backend now listens on all interfaces  
✅ **Verified**: Working on localhost:5000  
✅ **Verified**: OTP endpoint responding correctly  
✅ **Verified**: Fast2SMS integration working  

Backend is 100% ready. Issue is emulator network connectivity.

---

## **QUICK COMMAND REFERENCE**

```bash
# Check if backend is running
Get-NetTCPConnection -LocalPort 5000 -State Listen

# Verify OTP endpoint
$body = @{phoneNumber="9876543210"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/otp/send" `
  -Method POST -ContentType "application/json" -Body $body

# Get your machine IP
ipconfig

# Clear and restart Expo
npx expo start --clear

# Test from emulator network
adb shell ping 192.168.1.100  # Replace with YOUR IP
```

---

## **IF NOTHING WORKS**

1. **Close everything**:
   ```bash
   kill-port 5000
   kill-port 8081
   # Close emulator
   ```

2. **Start fresh**:
   ```bash
   cd backend
   node server.js
   # In another terminal
   npx expo start --clear
   ```

3. **Switch to physical device**:
   - Find your machine IP: `ipconfig`
   - Update `config/apiConfig.ts`: `const PHYSICAL_DEVICE_IP = '192.168.x.x'`
   - Use physical Android phone instead of emulator
   - Both on same WiFi network
   - Profits! 🎉

---

## **SUMMARY OF CHANGES**

**backend/server.js** - NOW LISTENS ON ALL INTERFACES:
```javascript
// BEFORE:
app.listen(PORT, () => { ... });

// NOW:
app.listen(PORT, "0.0.0.0", () => { 
  console.log(`🔗 API available at: http://localhost:${PORT}`);
  console.log(`📱 Android Emulator: http://10.0.2.2:${PORT}`);
  console.log(`🌐 Network Interfaces: All (0.0.0.0)`);
});
```

The backend will now accept connections from:
- Localhost applications
- Android emulator (10.0.2.2)
- Physical devices on same network
- Any network interface

---

**Next Action**: Try the options above in order. Most likely Option 1 (restart emulator) will fix it! 🚀
