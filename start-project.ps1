#!/usr/bin/env pwsh
# KAVACH Complete Project Startup Script
# Runs voice server + React Native app in one command

Write-Host "🚀 Starting KAVACH Complete Project..." -ForegroundColor Cyan

# Kill any existing processes on required ports
Write-Host "🔧 Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
$processId3001 = (netstat -ano | findstr ":3001" | Select-Object -First 1 | ForEach-Object { ($_ -split '\s+')[-1] })
if ($processId3001) { taskkill /PID $processId3001 /F 2>$null }
$processId8081 = (netstat -ano | findstr ":8081" | Select-Object -First 1 | ForEach-Object { ($_ -split '\s+')[-1] })
if ($processId8081) { taskkill /PID $processId8081 /F 2>$null }
Start-Sleep 2

# Start Voice Server in background
Write-Host "🎤 Starting Voice Server (Port 3001)..." -ForegroundColor Green
$voiceServerJob = Start-Process -FilePath "node" -ArgumentList "simple-voice-server.js" -WorkingDirectory "c:\Users\DebSarkar\Desktop\KAVACH-main\server" -WindowStyle Minimized -PassThru

# Wait for voice server to start
Start-Sleep 4

# Verify voice server is running
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5
    Write-Host "✅ Voice Server: READY" -ForegroundColor Green
} catch {
    Write-Host "❌ Voice Server: Failed to start" -ForegroundColor Red
}

# Start Expo Development Server
Write-Host "📱 Starting React Native App (Expo)..." -ForegroundColor Green
Write-Host "🎯 Project will open with QR code for mobile testing!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📍 SERVERS RUNNING:" -ForegroundColor Cyan
Write-Host "   • Voice Server: http://localhost:3001" -ForegroundColor White
Write-Host "   • React Native App: http://localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "📱 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "   1. Install Expo Go on your phone" -ForegroundColor White
Write-Host "   2. Scan the QR code that appears below" -ForegroundColor White
Write-Host "   3. Test voice features in the app!" -ForegroundColor White
Write-Host ""

# Start Expo (this will take over the terminal)
npx expo start