# Safe binary PostgreSQL backup: docker cp avoids Windows PowerShell 5.1 output redirection corruption.
# This saves the relational DB only. Back up the object-storage volume separately.
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    $backupDir = Join-Path (Get-Location) 'backups'
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    $file = Join-Path $backupDir ("med06-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.dump')
    & docker compose exec -T db pg_dump -U med06 -d med06 -Fc -f /tmp/med06.dump
    if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed.' }
    $container = (& docker compose ps -q db).Trim()
    if (-not $container) { throw 'Cannot find PostgreSQL container.' }
    & docker cp ($container + ':/tmp/med06.dump') $file
    if ($LASTEXITCODE -ne 0) { throw 'docker cp failed.' }
    & docker compose exec -T db rm -f /tmp/med06.dump
    Write-Host "PostgreSQL backup created: $file" -ForegroundColor Green
    Write-Host 'Reminder: cover images are in the separate object-store volume.'
}
finally { Pop-Location }
