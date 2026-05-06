#!/usr/bin/env bash
# mokumo#655 — allowlist drift gate.
#
# Iterates `.config/handler-scenario-coverage/allowlist.txt`, verifies every
# `tracked: <repo>#<n>` reference points to an OPEN issue. A closed issue
# whose entry is still in the allowlist means the work landed without the
# accompanying coverage restoration — fail so the next PR has to either
# re-open the issue, file a new one, or restore the coverage.
#
# Requires `gh` authenticated for the referenced repo(s). CI-only — the
# pre-push hook does not run this gate (no auth in hook context).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${HERE}/.." && pwd)"
cd "$ROOT"

ALLOWLIST="${1:-.config/handler-scenario-coverage/allowlist.txt}"

if [[ ! -f "$ALLOWLIST" ]]; then
    echo "drift-gate: $ALLOWLIST not present — nothing to check."
    exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
    echo "::error::drift-gate: gh CLI not installed" >&2
    exit 1
fi

mapfile -t TRACKED < <(
    # Strip full-line comments before extracting `tracked:` references —
    # the file's own format examples carry the same syntax and would
    # otherwise resolve as real entries.
    grep -vE '^[[:space:]]*#' "$ALLOWLIST" \
        | grep -oE 'tracked:[[:space:]]*[A-Za-z0-9_/.-]+#[0-9]+' \
        | sed -E 's/^tracked:[[:space:]]*//' \
        | sort -u
)

if (( ${#TRACKED[@]} == 0 )); then
    echo "drift-gate: no tracked references in $ALLOWLIST."
    exit 0
fi

CLOSED=()
for ref in "${TRACKED[@]}"; do
    repo="${ref%#*}"
    issue_num="${ref#*#}"
    # `repo` is either `<owner>/<name>` or a bare slug; gh resolves slugs
    # against the local remote. Be explicit when the reference includes a
    # slash to make CI behavior deterministic.
    args=(--json state)
    if [[ "$repo" == */* ]]; then
        args+=(--repo "$repo")
    fi
    state=$(gh issue view "$issue_num" "${args[@]}" --jq '.state' 2>/dev/null || echo "UNKNOWN")
    if [[ "$state" == "CLOSED" ]]; then
        CLOSED+=("$ref")
    elif [[ "$state" == "UNKNOWN" ]]; then
        echo "::warning::drift-gate: could not resolve $ref (network or auth issue?)" >&2
    fi
done

if (( ${#CLOSED[@]} > 0 )); then
    echo "::error::drift-gate: closed tracking issues with active allowlist entries:" >&2
    printf '  - %s\n' "${CLOSED[@]}" >&2
    cat >&2 <<EOF

Resolution: either restore the missing coverage (and remove the matching
allowlist entry), or open a new tracking issue and update the entry.
EOF
    exit 1
fi

echo "drift-gate: all ${#TRACKED[@]} tracked allowlist reference(s) are open."
