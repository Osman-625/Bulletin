param(
  [ValidateSet("quick", "full", "frontend", "security", "docs")]
  [string]$Mode = "quick"
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [scriptblock]$Script
  )

  Write-Host ""
  Write-Host "==> $Name"
  & $Script
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

switch ($Mode) {
  "quick" {
    Invoke-Step "Lint" { npm run lint }
    Invoke-Step "Typecheck" { npx tsc --noEmit }
    Invoke-Step "Unit tests" { npm test }
  }
  "full" {
    Invoke-Step "Lint" { npm run lint }
    Invoke-Step "Typecheck" { npx tsc --noEmit }
    Invoke-Step "Unit tests" { npm test }
    Invoke-Step "Build" { npm run build }
    Invoke-Step "E2E tests" { npm run test:e2e }
  }
  "frontend" {
    Invoke-Step "Lint" { npm run lint }
    Invoke-Step "Typecheck" { npx tsc --noEmit }
    Invoke-Step "Build" { npm run build }
  }
  "security" {
    Invoke-Step "Lint" { npm run lint }
    Invoke-Step "Typecheck" { npx tsc --noEmit }
    Invoke-Step "Audit production dependencies" { npm audit --omit=dev }
  }
  "docs" {
    Invoke-Step "Format check" { npm run format:check }
  }
}
