#!/usr/bin/env pwsh
# KAVACH System Diagnostic Script
# This script checks all components and identifies Axios errors

param(
    [switch]$AutoFix = $false
)

$ErrorActionPreference = "Continue"
$logFile = ".\DIAGNOSTIC_LOG_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

function Write-Log {
    param([string]$Message, [string]$Type = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Type) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "INFO" { "Cyan" }
        default { "White" }
    }
    $output = "[$timestamp] [$Type] $Message"
    Write-Host $output -ForegroundColor $color
    Add-Content -Path $logFile -Value $output
}

Write-Log "Starting KAVACH System Diagnostic..." "INFO"
Write-Log "Log file: $logFile" "INFO"

# Counter for issues found
$issuesFound = 0

# ====================
# 1. CHECK BACKEND
# ====================
Write-Log "`n========== 1. BACKEND CHECK ==========" "INFO"

$backendProc = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess

if ($backendProc) {
    Write-Log "✅ Backend running on port 5000 (PID: $backendProc)" "SUCCESS"
} else {
    Write-Log "❌ Backend NOT running on port 5000" "ERROR"
    $issuesFound++
    
    if ($AutoFix) {
        Write-Log "   🔧 Attempting to start backend..." "WARNING"
        try {
            cd backend
            Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow
            Start-Sleep -Seconds 3
            $backendProc = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
            if ($backendProc) {
                Write-Log "✅ Backend started successfully" "SUCCESS"
                $issuesFound--
            } else {
                Write-Log "❌ Failed to start backend" "ERROR"
            }
            cd ..
        } catch {
            Write-Log "❌ Error starting backend: $_" "ERROR"
        }
    }
}

# ====================
# 2. CHECK MONGODB
# ====================
Write-Log "`n========== 2. MONGODB CHECK ==========" "INFO"

$mongoProc = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoProc) {
    Write-Log "✅ MongoDB running (PID: $($mongoProc.Id))" "SUCCESS"
} else {
    Write-Log "⚠️  MongoDB not running on standard port" "WARNING"
}

# ====================
# 3. CHECK API HEALTH
# ====================
Write-Log "`n========== 3. API HEALTH CHECK ==========" "INFO"

try {
    $apiResponse = Invoke-RestMethod -Uri "http://localhost:5000/" -Method GET -TimeoutSec 5
    Write-Log "✅ API responding (Status: $($apiResponse.status))" "SUCCESS"
    Write-Log "   Version: $($apiResponse.version)" "INFO"
} catch {
    Write-Log "❌ API not responding: $($_.Exception.Message)" "ERROR"
    $issuesFound++
}

# ====================
# 4. CHECK OTP ENDPOINT
# ====================
Write-Log "`n========== 4. OTP ENDPOINT TEST ==========" "INFO"

try {
    $headers = @{"Content-Type" = "application/json"}
    $body = @{phoneNumber="7209799940"} | ConvertTo-Json
    $otpResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/otp/send" -Method POST -Headers $headers -Body $body -TimeoutSec 10
    
    if ($otpResponse.success) {
        Write-Log "✅ OTP endpoint working" "SUCCESS"
        Write-Log "   Message: $($otpResponse.message)" "INFO"
        Write-Log "   Sent to: $($otpResponse.to)" "INFO"
        Write-Log "   Request ID: $($otpResponse.request_id)" "INFO"
    } else {
        Write-Log "⚠️  OTP endpoint returned error: $($otpResponse.message)" "WARNING"
        Write-Log "   Error: $($otpResponse.error)" "WARNING"
        $issuesFound++
    }
} catch {
    Write-Log "❌ OTP endpoint failed: $($_.Exception.Message)" "ERROR"
    $issuesFound++
    
    # Detailed error info
    if ($_.Exception.Response) {
        Write-Log "   Status Code: $($_.Exception.Response.StatusCode)" "ERROR"
        Write-Log "   Status Desc: $($_.Exception.Response.StatusDescription)" "ERROR"
    }
}

# ====================
# 5. CHECK ENVIRONMENT
# ====================
Write-Log "`n========== 5. ENVIRONMENT VARIABLES ==========" "INFO"

$envPath = "backend\.env"
if (Test-Path $envPath) {
    Write-Log "✅ .env file found" "SUCCESS"
    
    $envContent = Get-Content $envPath
    $hasFast2SMS = $envContent | Select-String "FAST2SMS_API_KEY"
    $hasMongo = $envContent | Select-String "MONGO_URI"
    $hasJWT = $envContent | Select-String "JWT_SECRET"
    
    if ($hasFast2SMS) {
        Write-Log "✅ FAST2SMS_API_KEY configured" "SUCCESS"
    } else {
        Write-Log "❌ FAST2SMS_API_KEY missing" "ERROR"
        $issuesFound++
    }
    
    if ($hasMongo) {
        Write-Log "✅ MONGO_URI configured" "SUCCESS"
    } else {
        Write-Log "❌ MONGO_URI missing" "ERROR"
        $issuesFound++
    }
    
    if ($hasJWT) {
        Write-Log "✅ JWT_SECRET configured" "SUCCESS"
    } else {
        Write-Log "❌ JWT_SECRET missing" "ERROR"
        $issuesFound++
    }
} else {
    Write-Log "❌ .env file not found at $envPath" "ERROR"
    $issuesFound++
}

# ====================
# 6. CHECK DEPENDENCIES
# ====================
Write-Log "`n========== 6. DEPENDENCIES CHECK ==========" "INFO"

$packageJsonPath = "backend\package.json"
if (Test-Path $packageJsonPath) {
    Write-Log "✅ Backend package.json found" "SUCCESS"
    
    $packageContent = Get-Content $packageJsonPath
    $hasAxios = $packageContent | Select-String "axios"
    $hasExpress = $packageContent | Select-String "express"
    $hasCors = $packageContent | Select-String "cors"
    
    if ($hasAxios) { Write-Log "✅ axios installed" "SUCCESS" } else { Write-Log "❌ axios NOT installed" "ERROR"; $issuesFound++ }
    if ($hasExpress) { Write-Log "✅ express installed" "SUCCESS" } else { Write-Log "❌ express NOT installed" "ERROR"; $issuesFound++ }
    if ($hasCors) { Write-Log "✅ cors installed" "SUCCESS" } else { Write-Log "❌ cors NOT installed" "ERROR"; $issuesFound++ }
} else {
    Write-Log "❌ Backend package.json not found" "ERROR"
    $issuesFound++
}

# Frontend dependencies
$frontendPackageJsonPath = "package.json"
if (Test-Path $frontendPackageJsonPath) {
    Write-Log "✅ Frontend package.json found" "SUCCESS"
    
    $frontendContent = Get-Content $frontendPackageJsonPath
    $hasFrontendAxios = $frontendContent | Select-String '"axios"'
    $hasAsyncStorage = $frontendContent | Select-String "async-storage"
    
    if ($hasFrontendAxios) { Write-Log "✅ axios (frontend) installed" "SUCCESS" } else { Write-Log "❌ axios (frontend) NOT installed" "ERROR"; $issuesFound++ }
    if ($hasAsyncStorage) { Write-Log "✅ async-storage (frontend) installed" "SUCCESS" } else { Write-Log "❌ async-storage (frontend) NOT installed" "ERROR"; $issuesFound++ }
} else {
    Write-Log "❌ Frontend package.json not found" "ERROR"
    $issuesFound++
}

# ====================
# 7. CHECK NETWORK
# ====================
Write-Log "`n========== 7. NETWORK CONNECTIVITY ==========" "INFO"

try {
    $localhostTest = Test-Connection localhost -Count 1 -Quiet
    if ($localhostTest) {
        Write-Log "✅ localhost is reachable" "SUCCESS"
    } else {
        Write-Log "⚠️  Cannot ping localhost" "WARNING"
    }
} catch {
    Write-Log "⚠️  Error testing localhost" "WARNING"
}

try {
    $emulatorTest = Test-Connection 10.0.2.2 -Count 1 -Quiet
    if ($emulatorTest) {
        Write-Log "✅ 10.0.2.2 (Android emulator) is reachable" "SUCCESS"
    } else {
        Write-Log "⚠️  Cannot reach 10.0.2.2 (Android emulator)" "WARNING"
    }
} catch {
    Write-Log "⚠️  Error testing 10.0.2.2" "WARNING"
}

# ====================
# 8. CHECK CONFIG FILES
# ====================
Write-Log "`n========== 8. CONFIG FILES CHECK ==========" "INFO"

$configPaths = @(
    "config/apiConfig.ts"
    "services/realOtpService.ts"
    "backend/services/fast2smsService.js"
    "backend/routes/otpRoutes.js"
)

foreach ($configPath in $configPaths) {
    if (Test-Path $configPath) {
        Write-Log "✅ $configPath exists" "SUCCESS"
    } else {
        Write-Log "❌ $configPath NOT found" "ERROR"
        $issuesFound++
    }
}

# ====================
# 9. PORT STATUS
# ====================
Write-Log "`n========== 9. PORT STATUS ==========" "INFO"

$ports = @(5000, 8081, 27017)
foreach ($port in $ports) {
    $portProc = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($portProc) {
        Write-Log "✅ Port $port in use (PID: $portProc)" "SUCCESS"
    } else {
        Write-Log "⚠️  Port $port not in use" "WARNING"
    }
}

# ====================
# SUMMARY
# ====================
Write-Log "`n========== DIAGNOSTIC SUMMARY ==========" "INFO"

if ($issuesFound -eq 0) {
    Write-Host "`n✅ ALL CHECKS PASSED - SYSTEM IS READY!" -ForegroundColor Green
    Write-Log "All diagnostic checks passed!" "SUCCESS"
} else {
    Write-Host "`n⚠️  $issuesFound ISSUE(S) FOUND - See above for details" -ForegroundColor Yellow
    Write-Log "$issuesFound issue(s) found during diagnostic" "WARNING"
}

Write-Log "Diagnostic complete. Full log saved to: $logFile" "INFO"

# Offer auto-fix options
if ($issuesFound -gt 0) {
    Write-Host "`nQuick Fixes:" -ForegroundColor Cyan
    Write-Host "1. Start Backend: cd backend; node server.js" -ForegroundColor Yellow
    Write-Host "2. Install Dependencies: npm install" -ForegroundColor Yellow
    Write-Host "3. Check .env: cat backend\.env" -ForegroundColor Yellow
    Write-Host "4. Restart Expo: npx expo start --clear" -ForegroundColor Yellow
    Write-Host "5. Kill Port 5000: kill-port 5000" -ForegroundColor Yellow
}
