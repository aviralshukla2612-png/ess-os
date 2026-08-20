$server = "root@200.97.161.91"
$remotePath = "/vps"
$zipFile = "mdz-os.zip"

Write-Host "Creating deployment archive (ignoring node_modules and .next)..."
# Use compress-archive but exclude folders
# We'll use a temporary folder for staging
$tempDir = Join-Path $env:TEMP "mdz-os-deploy"
If (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "Copying files to staging..."
# Robocopy is perfect for this
robocopy . $tempDir /MIR /XD node_modules .next .git .env /XF *.zip deploy.ps1 > $null

Write-Host "Zipping..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -Force

Write-Host "Uploading to VPS ($server)... You will be prompted for your SSH password."
scp $zipFile "${server}:${remotePath}/"

Write-Host "Upload complete. Cleaning up..."
Remove-Item $zipFile
Remove-Item -Recurse -Force $tempDir

Write-Host ""
Write-Host "Done! Now go to your SSH terminal and run:"
Write-Host "cd /vps"
Write-Host "unzip mdz-os.zip -d mdz-os"
Write-Host "cd mdz-os"
Write-Host "docker compose up -d --build"
