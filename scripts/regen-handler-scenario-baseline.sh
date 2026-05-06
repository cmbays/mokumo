#!/usr/bin/env bash
# mokumo#655 — regenerate `.config/handler-scenario-coverage/baseline.txt`
# from the most recent producer artifact.
#
# Reads `handler-scenario-coverage.json` (default in workspace root),
# emits one line per `(method, path)` row that lacks happy or error_4xx
# coverage AND is not already in the allowlist. Use this when:
#   * Initially seeding the baseline at gate-live (one-time).
#   * Backfilling after deliberately retiring an allowlist entry that
#     turned out to need a longer-term gap (rare).
#
# This script does NOT regenerate automatically in CI. Baseline drift is
# operator-driven — the gate fails if a non-baselined, non-allowlisted
# row is missing coverage, and the operator chooses whether to add to
# baseline (one-time freeze of un-tracked legacy gaps) or allowlist (new
# gap with a tracked owner).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${HERE}/.." && pwd)"
cd "$ROOT"

ARTIFACT="${ARTIFACT:-handler-scenario-coverage.json}"
BASELINE="${BASELINE:-.config/handler-scenario-coverage/baseline.txt}"

if [[ ! -f "$ARTIFACT" ]]; then
    echo "::error::regen-baseline: $ARTIFACT not found." >&2
    echo "Run \`cargo run -p docs-gen --bin handler-scenario-coverage -- ...\` first." >&2
    exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
    echo "::error::regen-baseline: jq required" >&2
    exit 1
fi

GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

HEADER="# Handler ↔ scenario coverage baseline (mokumo#655).
#
# Frozen list of (METHOD, path) rows that lacked happy + 4xx coverage at
# gate-live. Regenerate via \`scripts/regen-handler-scenario-baseline.sh\`
# — see ops/standards/testing.md §\"Handler ↔ scenario traceability\"."

{
    echo "$HEADER"
    echo "#"
    echo "# Last regenerated against commit ${GIT_SHA}."
    echo
    jq -r '
        .by_crate[]?.handlers[]?
        | select((.happy | length) == 0 or (.error_4xx | length) == 0)
        | [.method, .path] | @tsv
    ' "$ARTIFACT" \
    | sort -u \
    | awk -F'\t' '{ printf "%-6s %s  # baselined: '"${GIT_SHA}"'\n", $1, $2 }'
} > "$BASELINE.tmp"

mv "$BASELINE.tmp" "$BASELINE"
n=$(grep -cv '^#\|^$' "$BASELINE" || true)
echo "regen-baseline: wrote $BASELINE ($n entr$( ((n==1)) && echo y || echo ies))"
