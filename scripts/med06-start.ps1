# MED-06: run from any working directory on Windows PowerShell 5.1+.
# Does not pull, reset, delete volumes or overwrite .env.
param([switch]$Seed)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
    if (-not (Test-Path '.env')) {
        throw 'Chua co .env: can cau hinh PostgreSQL, JWT va object storage truoc.'
    }
    Write-Host 'Starting MED-06 (PostgreSQL, API, website, object storage)...'
    & docker compose --profile storage up --build -d
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose start failed.' }
    if ($Seed) {
        & docker compose --profile seed --profile storage run --rm seed
        if ($LASTEXITCODE -ne 0) { throw 'Seed failed.' }
    }
    & docker compose --profile storage ps -a
    if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect containers.' }
    Write-Host 'Website: http://localhost:3000'
    Write-Host 'Backend health: http://localhost:3001/api/health'
    Write-Host 'Run scripts/med06-test.ps1 to verify services.'
}
finally { Pop-Location }
