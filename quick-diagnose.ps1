#!/usr/bin/env pwsh
# KAVACH Quick Diagnostic

Write-Host "`n========== KAVACH SYSTEM DIAGNOSTIC ==========" -ForegroundColor Cyan

# 1. Check Backend
Write-Host "`n1. Backend Status:" -ForegroundColor Yellow
$backendProc = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($backendProc) {
    Write-Host "   ✅ Backend running on port 5000" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend NOT running" -ForegroundColor Red
}

# 2. Check API Health
Write-Host "`n2. API Health:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/" -Method GET -TimeoutSec 5
    Write-Host "   ✅ API responding: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ API not available: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Test OTP Endpoint
Write-Host "`n3. OTP Endpoint Test:" -ForegroundColor Yellow
try {
    $headers = @{"Content-Type" = "application/json"}
    $body = @{phoneNumber="7209799940"} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/otp/send" -Method POST -Headers $headers -Body $body -TimeoutSec 10
    if ($response.success) {
        Write-Host "   ✅ OTP endpoint working" -ForegroundColor Green
        Write-Host "      Message: $($response.message)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ OTP endpoint error: $($response.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ OTP endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Check Environment
Write-Host "`n4. Environment Configuration:" -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    $envContent = Get-Content "backend\.env"
    if ($envContent | Select-String "FAST2SMS_API_KEY") {
        Write-Host "   ✅ FAST2SMS_API_KEY configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAST2SMS_API_KEY missing" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ .env file not found" -ForegroundColor Red
}

# 5. Check Files Exist
Write-Host "`n5. Required Files:" -ForegroundColor Yellow
$files = @("config/apiConfig.ts", "services/realOtpService.ts", "backend/services/fast2smsService.js")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
    }
}

# 6. Port Status
Write-Host "`n6. Port Status:" -ForegroundColor Yellow
$ports = @(@{port=5000; name="Backend"}, @{port=8081; name="Expo"}, @{port=27017; name="MongoDB"})
foreach ($p in $ports) {
    $proc = Get-NetTCPConnection -LocalPort $p.port -State Listen -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "   ✅ Port $($p.port) ($($p.name)) in use" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Port $($p.port) ($($p.name)) not in use" -ForegroundColor Yellow
    }
}

Write-Host "`n========== END DIAGNOSTIC ==========" -ForegroundColor Cyan
Write-Host "For detailed information, see AXIOS_ERROR_DIAGNOSIS.md" -ForegroundColor Cyan
