# Non-destructive smoke test for local Windows PowerShell.
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    $health = Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -TimeoutSec 15
    if ($health.status -ne 'ok' -or $health.database -ne 'connected') {
        throw 'Backend or PostgreSQL did not report healthy.'
    }
    $list = Invoke-RestMethod -Uri 'http://localhost:3001/api/events' -TimeoutSec 15
    if ($null -eq $list.items) { throw 'Events API returned unexpected data.' }
    $search = Invoke-RestMethod -Uri 'http://localhost:3001/api/events?q=Di%20san' -TimeoutSec 15
    if ($null -eq $search.items) { throw 'Search API returned unexpected data.' }
    $page = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 20
    if ($page.StatusCode -ne 200) { throw 'Next.js did not return HTTP 200.' }
    $counts = & docker compose exec -T db psql -U med06 -d med06 -At -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';"
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL table query failed.' }
    if ([int]($counts | Select-Object -Last 1) -lt 17) {
        throw 'Missing business or technical PostgreSQL tables.'
    }
    Write-Host "PASS: API healthy; events=$($list.items.Count); search works; frontend HTTP 200; public tables=$($counts | Select-Object -Last 1)" -ForegroundColor Green
}
finally { Pop-Location }
