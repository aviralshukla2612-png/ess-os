$ErrorActionPreference = "SilentlyContinue"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " ESS OS - Clean Dev Server (Port 3040)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Kill any process on port 3040
Write-Host "[1/2] Releasing Port 3040..." -ForegroundColor Yellow
$procId = Get-NetTCPConnection -LocalPort 3040 | Select-Object -ExpandProperty OwningProcess -Unique
if ($procId) {
    Stop-Process -Id $procId -Force
}

# 2. Clean cache safely
Write-Host "[2/2] Launching Next.js Dev Server on Port 3040..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}

# 3. Start Next.js on port 3040
npx next dev -p 3040
