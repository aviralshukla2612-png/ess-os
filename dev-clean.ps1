$ErrorActionPreference = "SilentlyContinue"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " EMPEROR OS - Clean Dev Server (Port 3020)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Kill any process on port 3020
Write-Host "[1/2] Releasing Port 3020..." -ForegroundColor Yellow
$procId = Get-NetTCPConnection -LocalPort 3020 | Select-Object -ExpandProperty OwningProcess -Unique
if ($procId) {
    Stop-Process -Id $procId -Force
}

# 2. Clean cache safely
Write-Host "[2/2] Launching Next.js Dev Server on Port 3020..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}

# 3. Start Next.js on port 3020
npx next dev -p 3020
