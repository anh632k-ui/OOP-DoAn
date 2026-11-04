# MED-06 local demo: grant the FIRST ADMIN to an existing account.
param(
    [Parameter(Mandatory=$true)]
    [ValidatePattern('^[^@\s]+@[^@\s]+\.[^@\s]+$')]
    [string]$Email
)
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    $lookup = @'
SELECT EXISTS(
  SELECT 1 FROM nguoi_dung
  WHERE lower(email)=lower(:'target_email') AND trang_thai='HOAT_DONG'
);
'@
    $found = $lookup | & docker compose exec -T db psql -U med06 -d med06 -v ON_ERROR_STOP=1 -v "target_email=$Email" -A -t
    if ($LASTEXITCODE -ne 0) { throw 'Cannot check local PostgreSQL.' }
    if (($found | Out-String).Trim() -ne 't') {
        throw 'Account not found or inactive. Register the account first.'
    }
    Write-Host "Demo account: $Email"
    Write-Host 'ADMIN controls MED-06 users, events, allocations and check-in.'
    $confirm = Read-Host 'Type GRANT-ADMIN to authorize (local demo only)'
    if ($confirm -cne 'GRANT-ADMIN') {
        Write-Host 'No changes made.'
        return
    }
    $grant = @'
BEGIN;
INSERT INTO nguoi_dung_vai_tro(ma_nguoi_dung,ma_vai_tro)
SELECT n.ma_nguoi_dung,v.ma_vai_tro
FROM nguoi_dung n CROSS JOIN vai_tro v
WHERE lower(n.email)=lower(:'target_email')
  AND n.trang_thai='HOAT_DONG'
  AND v.ten_vai_tro='ADMIN'
ON CONFLICT DO NOTHING;
INSERT INTO nhat_ky_he_thong(ma_nguoi_dung,hanh_dong,chi_tiet)
SELECT n.ma_nguoi_dung,'BOOTSTRAP_ADMIN',
  jsonb_build_object('userId',n.ma_nguoi_dung)
FROM nguoi_dung n WHERE lower(n.email)=lower(:'target_email');
COMMIT;
'@
    $grant | & docker compose exec -T db psql -U med06 -d med06 -v ON_ERROR_STOP=1 -v "target_email=$Email"
    if ($LASTEXITCODE -ne 0) { throw 'The ADMIN grant did not complete.' }
    Write-Host 'ADMIN granted. Open http://localhost:3000/admin.'
}
finally { Pop-Location }
