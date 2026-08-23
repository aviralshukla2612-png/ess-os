$BackupDir = ".\backups"
$DbPath = ".\prisma\dev.db"
$Timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$BackupFile = "$BackupDir\dev_$Timestamp.db"

if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

if (-not (Test-Path -Path $DbPath)) {
    Write-Error "Error: Database file not found at $DbPath"
    exit 1
}

Write-Host "Creating backup..."
# If sqlite3 is installed and in PATH, use online backup API
# Otherwise, just copy the file since this is a basic backup script
# docker exec mdz-os-app sqlite3 /app/prisma/dev.db ".backup /app/prisma/backup.db" could also be used
try {
    sqlite3 $DbPath ".backup '$BackupFile'"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backup created successfully at $BackupFile"
    } else {
        # Fallback to copy if sqlite3 fails or isn't installed locally
        Copy-Item -Path $DbPath -Destination $BackupFile -Force
        Write-Host "Backup (copy) created successfully at $BackupFile"
    }
} catch {
    Copy-Item -Path $DbPath -Destination $BackupFile -Force
    Write-Host "Backup (copy) created successfully at $BackupFile"
}
