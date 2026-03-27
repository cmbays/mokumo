#!/usr/bin/env bash
# Enforces ADR-6: every component under src/lib/components/ must have a sibling .stories.ts file.
# Runs as a lefthook pre-commit hook — checks only staged .svelte files.

set -euo pipefail

missing=()

# Get staged .svelte files under the components directory
while IFS= read -r file; do
  [[ -z "$file" ]] && continue

  # Derive expected story path: Button.svelte -> Button.stories.ts
  dir=$(dirname "$file")
  base=$(basename "$file" .svelte)
  story_file="${dir}/${base}.stories.ts"

  if [[ ! -f "$story_file" ]]; then
    missing+=("$file")
  fi
done < <(git diff --cached --name-only --diff-filter=ACM -- 'apps/web/src/lib/components/**/*.svelte')

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Story co-location check failed (ADR-6):"
  echo ""
  for file in "${missing[@]}"; do
    dir=$(dirname "$file")
    base=$(basename "$file" .svelte)
    echo "  Missing story file for ${file}"
    echo "    Create: ${dir}/${base}.stories.ts"
    echo ""
  done
  exit 1
fi
