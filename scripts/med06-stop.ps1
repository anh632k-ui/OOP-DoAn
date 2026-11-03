# Stop MED-06 containers without deleting PostgreSQL or object-storage volumes.
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    & docker compose --profile storage down
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose down failed.' }
    Write-Host 'Containers stopped. Data volumes preserved.'
}
finally { Pop-Location }
