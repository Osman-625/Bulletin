param(
  [Parameter(Mandatory = $true)]
  [string]$RepoPath,

  [int]$MaxIterations = 5,

  [string]$AskForApproval = $env:ASK_FOR_APPROVAL,

  [string]$PromptFile = $env:PROMPT_FILE
)

$ErrorActionPreference = "Stop"

if ($MaxIterations -lt 1) {
  Write-Error "max_iterations must be a positive integer."
  exit 2
}

$Repo = (Resolve-Path -LiteralPath $RepoPath).Path
$ScriptDir = Split-Path -Parent $PSCommandPath

if ([string]::IsNullOrWhiteSpace($AskForApproval)) {
  $AskForApproval = "on-request"
}

if ([string]::IsNullOrWhiteSpace($PromptFile)) {
  $PromptFile = Join-Path $ScriptDir "api_security_audit_prompt.md"
}

$Report = Join-Path $Repo "AUDIT_REPORT.json"
$PrevReport = Join-Path $Repo "AUDIT_REPORT_prev.json"

if (-not (Test-Path -LiteralPath (Join-Path $Repo ".git") -PathType Container)) {
  Write-Warning "$Repo is not a git repo. You will have no way to review or undo changes Codex makes other than reading the diff manually."
}

if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
  Write-Error "codex CLI is required. Install it and run 'codex login' first."
  exit 1
}

if (-not (Test-Path -LiteralPath $PromptFile -PathType Leaf)) {
  Write-Error "prompt file not found at $PromptFile. Expected it alongside this script, or set PROMPT_FILE."
  exit 1
}

for ($i = 1; $i -le $MaxIterations; $i++) {
  Write-Host "=== Audit iteration $i/$MaxIterations ($Repo) ==="

  if (Test-Path -LiteralPath $Report -PathType Leaf) {
    Copy-Item -LiteralPath $Report -Destination $PrevReport -Force
    $PrevLine = "PREVIOUS_REPORT: $PrevReport"
  } else {
    $PrevLine = "PREVIOUS_REPORT: none"
  }

  $RunContext = @"
# RUN CONTEXT
REPO_ROOT: $Repo
STACK: Next.js 16.2.6 App Router + React 19 + TypeScript + Tailwind CSS v4 + Supabase + Vercel
ENTRY_POINTS: src/app/**/route.ts; src/app/**/actions.ts; server actions under src/app/**; src/lib/data.ts; src/proxy.ts; supabase RLS policies represented in supabase/migrations/**
AUTH_MODEL: Supabase cookie sessions, Supabase RLS, src/proxy.ts role redirects, and server-action authorization checks
NETWORK_AVAILABLE: no
$PrevLine
"@

  $Prompt = Get-Content -Raw -LiteralPath $PromptFile
  $Payload = $RunContext + [Environment]::NewLine + [Environment]::NewLine + $Prompt

  $Payload | codex `
    --ask-for-approval $AskForApproval `
    exec `
    --cd $Repo `
    --sandbox workspace-write `
    -

  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  if (Test-Path -LiteralPath (Join-Path $Repo ".git") -PathType Container) {
    Write-Host "--- changes this iteration ---"
    git -C $Repo diff --stat
    Write-Host "Review the diff above before continuing. Nothing was committed automatically."
  }

  if (-not (Test-Path -LiteralPath $Report -PathType Leaf)) {
    Write-Error "No AUDIT_REPORT.json produced this run; stopping. Check Codex output above."
    exit 1
  }

  $Items = Get-Content -Raw -LiteralPath $Report | ConvertFrom-Json
  $Unresolved = @($Items | Where-Object { $_.status -eq "CONFIRMED" -and -not $_.verified }).Count

  if ($Unresolved -eq 0) {
    Write-Host "All CONFIRMED findings are resolved and verified after $i iteration(s)."
    exit 0
  }

  Write-Host "$Unresolved unresolved CONFIRMED finding(s) remain; looping."
}

Write-Error "Hit max iterations ($MaxIterations) with findings still unresolved. Stop and review manually - repeated auto-fix attempts on the same finding usually means the fix needs a human call, not another iteration."
exit 2
