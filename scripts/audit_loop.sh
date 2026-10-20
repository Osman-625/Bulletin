#!/usr/bin/env bash
#
# audit_loop.sh - repeatedly re-runs the API security audit prompt against this
# repo via `codex exec`, until no CONFIRMED-but-unverified findings remain or a
# max iteration count is hit.
#
# Supervised by default: uses --ask-for-approval on-request, which means Codex
# will pause for approval before risky actions. That makes this unsuitable for
# unattended cron jobs as-is. For unattended use in a disposable environment,
# set ASK_FOR_APPROVAL=never explicitly and accept the tradeoff.
#
# Requirements:
# - codex CLI installed and authenticated
# - jq installed
# - bash-compatible shell
#
# Usage:
#   bash scripts/audit_loop.sh /path/to/repo [max_iterations]
#   ASK_FOR_APPROVAL=never bash scripts/audit_loop.sh /path/to/repo 3

set -euo pipefail

usage() {
  echo "Usage: $0 <repo_path> [max_iterations]" >&2
}

if [ "${1:-}" = "" ]; then
  usage
  exit 2
fi

REPO_INPUT="$1"
MAX_ITER="${2:-5}"

if ! [[ "$MAX_ITER" =~ ^[1-9][0-9]*$ ]]; then
  echo "ERROR: max_iterations must be a positive integer." >&2
  usage
  exit 2
fi

if ! REPO_POSIX="$(cd "$REPO_INPUT" && pwd)"; then
  echo "ERROR: repo path does not exist or is not accessible: $REPO_INPUT" >&2
  exit 1
fi

# Git Bash on Windows can expose a native path for Windows-native CLIs. On
# Unix-like shells this fails and we keep the POSIX path.
if REPO_NATIVE="$(cd "$REPO_INPUT" && pwd -W 2>/dev/null)"; then
  REPO="$REPO_NATIVE"
else
  REPO="$REPO_POSIX"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="${PROMPT_FILE:-$SCRIPT_DIR/api_security_audit_prompt.md}"
REPORT="$REPO/AUDIT_REPORT.json"
PREV_REPORT="$REPO/AUDIT_REPORT_prev.json"
ASK_FOR_APPROVAL="${ASK_FOR_APPROVAL:-on-request}"

if [ ! -d "$REPO/.git" ]; then
  echo "WARNING: $REPO is not a git repo. You will have no way to review or undo" >&2
  echo "         changes Codex makes other than reading the diff manually." >&2
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "ERROR: codex CLI is required. Install it and run 'codex login' first." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required to parse AUDIT_REPORT.json. Install it and retry." >&2
  exit 1
fi

if [ ! -f "$PROMPT_FILE" ]; then
  echo "ERROR: prompt file not found at $PROMPT_FILE" >&2
  echo "       Expected it alongside this script, or set PROMPT_FILE=/path/to/file." >&2
  exit 1
fi

for i in $(seq 1 "$MAX_ITER"); do
  echo "=== Audit iteration $i/$MAX_ITER ($REPO) ==="

  if [ -f "$REPORT" ]; then
    cp "$REPORT" "$PREV_REPORT"
    PREV_LINE="PREVIOUS_REPORT: $PREV_REPORT"
  else
    PREV_LINE="PREVIOUS_REPORT: none"
  fi

  {
    cat <<RUN_CONTEXT
# RUN CONTEXT
REPO_ROOT: $REPO
STACK: Next.js 16.2.6 App Router + React 19 + TypeScript + Tailwind CSS v4 + Supabase + Vercel
ENTRY_POINTS: src/app/**/route.ts; src/app/**/actions.ts; server actions under src/app/**; src/lib/data.ts; src/proxy.ts; supabase RLS policies represented in supabase/migrations/**
AUTH_MODEL: Supabase cookie sessions, Supabase RLS, src/proxy.ts role redirects, and server-action authorization checks
NETWORK_AVAILABLE: no
$PREV_LINE
RUN_CONTEXT
    echo
    cat "$PROMPT_FILE"
  } | codex --ask-for-approval "$ASK_FOR_APPROVAL" exec \
    --cd "$REPO" \
    --sandbox workspace-write \
    -

  if [ -d "$REPO/.git" ]; then
    echo "--- changes this iteration ---"
    git -C "$REPO" diff --stat || true
    echo "Review the diff above before continuing. Nothing was committed automatically."
  fi

  if [ ! -f "$REPORT" ]; then
    echo "No AUDIT_REPORT.json produced this run; stopping. Check Codex output above." >&2
    exit 1
  fi

  UNRESOLVED="$(jq '[.[] | select(.status=="CONFIRMED" and (.verified|not))] | length' "$REPORT")"

  if [ "$UNRESOLVED" -eq 0 ]; then
    echo "All CONFIRMED findings are resolved and verified after $i iteration(s)."
    exit 0
  fi

  echo "$UNRESOLVED unresolved CONFIRMED finding(s) remain; looping."
done

echo "Hit max iterations ($MAX_ITER) with findings still unresolved. Stop and review manually -" >&2
echo "repeated auto-fix attempts on the same finding usually means the fix needs a human call," >&2
echo "not another iteration." >&2
exit 2
