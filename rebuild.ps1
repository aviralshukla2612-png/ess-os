Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " ESS OS - Clean Rebuild Without Cache" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Remove .next build directory & cache
Write-Host "[1/2] Clearing Next.js build cache (.next)..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}
Write-Host "Cache directory is clean." -ForegroundColor Green

# 2. Perform fresh production build
Write-Host "[2/2] Building Next.js production bundle from scratch..." -ForegroundColor Yellow
npx next build

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " Clean Rebuild Complete! Zero Cache Used." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "To start the production server, run:" -ForegroundColor White
Write-Host "  npm run start -- -p 3040" -ForegroundColor Yellow
