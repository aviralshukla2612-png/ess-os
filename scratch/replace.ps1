$directories = @("src", "tests", "scripts")
$rootFiles = Get-ChildItem -Path . -File | Where-Object { $_.Extension -match "\.(ts|tsx|js|jsx|mjs|md|json)$" -and $_.Name -notmatch "package-lock.json" }
$allFiles = @($rootFiles)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        $allFiles += Get-ChildItem -Path $dir -Recurse -File | Where-Object { $_.Extension -match "\.(ts|tsx|js|jsx|mjs|md|json)$" }
    }
}

foreach ($file in $allFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ($null -eq $content) { continue }
    
    $newContent = $content -creplace "ESS", "ESS"
    $newContent = $newContent -creplace "ess", "ess"
    $newContent = $newContent -creplace "Ess", "Ess"
    $newContent = $newContent -creplace "ess-logo\.jpg", "ess-logo.png"
    
    if ($content -ne $newContent) {
        [System.IO.File]::WriteAllText($file.FullName, $newContent)
        Write-Host "Updated: $($file.FullName)"
    }
}
