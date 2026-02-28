#!/usr/bin/env bash
# Push .env.local vars to Vercel (preview + production).
#
# Usage:
#   bash scripts/vercel-env-push.sh
#
# Requires the Vercel CLI to be authenticated:
#   npx vercel login   (or VERCEL_TOKEN exported in your shell)
#
# Skips:
#   - Comments (#) and blank lines
#   - VERCEL_* vars (CI-only, stored in GitHub Secrets not Vercel)
#
# NOTE: Review your .env.local first — localhost Supabase URLs
# (http://localhost:54321) need to be the cloud values before pushing.

set -euo pipefail

ENV_FILE="${1:-.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found" >&2
  exit 1
fi

ENVIRONMENTS=("preview" "production")

while IFS= read -r line; do
  # Skip blank lines and comments
  [[ -z "$line" || "$line" == \#* ]] && continue

  key="${line%%=*}"
  value="${line#*=}"

  # Skip CI-only vars — these live in GitHub Secrets, not Vercel
  if [[ "$key" == VERCEL_* ]]; then
    echo "  skip (CI-only): $key"
    continue
  fi

  for env in "${ENVIRONMENTS[@]}"; do
    echo "  → $key → $env"
    printf '%s' "$value" | npx vercel env add "$key" "$env" --force 2>/dev/null || \
      echo "    ⚠ failed: $key ($env)"
  done

done < "$ENV_FILE"

echo ""
echo "Done. Verify at: https://vercel.com/christopher-bays-projects/print-4ink/settings/environment-variables"
