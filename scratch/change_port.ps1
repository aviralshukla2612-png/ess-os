$root = "."
$allFiles = Get-ChildItem -Path $root -Recurse -File | Where-Object { 
    $_.FullName -notmatch "\\node_modules\\" -and 
    $_.FullName -notmatch "\\\.git\\" -and 
    $_.FullName -notmatch "\\\.next\\" -and 
    $_.Extension -match "\.(ts|tsx|js|jsx|mjs|md|json|yml|yaml|sh|ps1|conf|env|example|mjs)$" -and 
    $_.Name -notmatch "package-lock\.json" -and
    $_.Name -notmatch "pnpm-lock\.yaml"
}

foreach ($file in $allFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ($null -eq $content) { continue }
    
    $newContent = $content -creplace "3040", "3040"
    
    if ($content -ne $newContent) {
        [System.IO.File]::WriteAllText($file.FullName, $newContent)
        Write-Host "Updated: $($file.FullName)"
    }
}

$dockerfile = Get-Item -Path "Dockerfile"
$content = [System.IO.File]::ReadAllText($dockerfile.FullName)
$newContent = $content -creplace "3040", "3040"
if ($content -ne $newContent) {
    [System.IO.File]::WriteAllText($dockerfile.FullName, $newContent)
    Write-Host "Updated: $($dockerfile.FullName)"
}
