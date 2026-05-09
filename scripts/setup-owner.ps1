# Bootstrap the owner account via POST /api/setup.
# Run once after deploying to a fresh environment.
# Usage: .\scripts\setup-owner.ps1 [-Url http://localhost:3000] [-Secret your-secret]

param(
    [string]$Url    = '',
    [string]$Secret = $env:SETUP_SECRET
)

if (-not $Url) {
    $Url = if ($env:NEXT_PUBLIC_APP_URL) { $env:NEXT_PUBLIC_APP_URL } else { 'http://localhost:3000' }
}

if (-not $Secret) {
    Write-Error "SETUP_SECRET is not set. Pass -Secret or set the env var."
    exit 1
}

if ($env:ENABLE_SETUP_ROUTE -ne '1') {
    Write-Warning "ENABLE_SETUP_ROUTE is not 1 in this shell. Make sure the running app environment has ENABLE_SETUP_ROUTE=1 before bootstrapping."
}

Write-Host "Bootstrapping owner account at $Url ..."

try {
    $response = Invoke-RestMethod `
        -Method POST `
        -Uri "$Url/api/setup" `
        -Headers @{ "x-setup-secret" = $Secret } `
        -ContentType "application/json" `
        -ErrorAction Stop

    Write-Host ""
    Write-Host "Owner account created." -ForegroundColor Green
    Write-Host "  Username:      $($response.username)"
    Write-Host "  Temp password: $($response.temp_password)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $response.note -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Log in at $Url/login"
    Write-Host "  2. Change your password when prompted"
    Write-Host "  3. Set ENABLE_SETUP_ROUTE=0 or remove it from your environment"
}
catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 409) {
        Write-Host "Setup already complete — owner account exists." -ForegroundColor Yellow
    } elseif ($status -eq 403) {
        Write-Error "Forbidden — check that SETUP_SECRET matches the deployed value."
    } elseif ($status -eq 404) {
        Write-Error "Setup route is disabled — set ENABLE_SETUP_ROUTE=1 in the running app environment, then try again."
    } else {
        Write-Error "Request failed: $_"
    }
    exit 1
}
