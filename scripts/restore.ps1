param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$DbPath = ".\prisma\dev.db"

if (-not (Test-Path -Path $BackupFile)) {
    Write-Error "Error: Backup file not found at $BackupFile"
    exit 1
}

Write-Host "WARNING: This will overwrite the current database." -ForegroundColor Yellow
$response = Read-Host "Are you sure you want to continue? (y/N)"
if ($response -notmatch "^[Yy]$") {
    Write-Host "Restore aborted."
    exit 1
}

Write-Host "Stopping mdz-os-app container to prevent data corruption during restore..."
docker stop mdz-os-app | Out-Null

Copy-Item -Path $BackupFile -Destination $DbPath -Force

Write-Host "Database restored successfully."
Write-Host "Starting mdz-os-app container..."
docker start mdz-os-app | Out-Null

Write-Host "Restore complete!" -ForegroundColor Green
