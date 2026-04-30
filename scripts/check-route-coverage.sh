#!/usr/bin/env bash
# Guard: every newly-introduced API route in the diff requires hurl coverage
# for each HTTP method, OR a matching entry in the moon.yml exclusion ledger.
#
# Scope (v2):
#   - Detects added `.route("...", <method>(...))` and `.nest("/api/...", ...)`
#     calls under `crates/**/src/**/*.rs`.
#   - Resolves relative paths in sub-routers: a `.route("/{id}/restore", ...)`
#     added inside a function whose name appears as the second arg of an
#     existing `.nest("/api/<prefix>", <fn>())` is treated as
#     `/api/<prefix>/{id}/restore`.
#   - Per-method coverage: each HTTP method on a route (`get(...).post(...)`
#     yields two endpoints) is checked independently. Coverage matches when a
#     hurl file has a request line `<METHOD> http(s)?://<host><path>` with
#     `{id}`-style segments treated as `[^/]+`.
#
# v1 false-negatives this version closes (mokumo#729 Piece 2):
#   - Sub-router relative-path routes (was the largest known v1 gap).
#   - Adding additional methods to an already-covered domain (per-method).
#
# Background: mokumo CLAUDE.md mandates per-endpoint hurl coverage:
#   "New API endpoints require a `.hurl` file — add
#   `tests/api/<domain>/<endpoint>.hurl` in the same PR."
#
# Diff base: `origin/main`. Local hooks rely on the user having fetched
# recently; stale base is acceptable for local checks because CI is the
# source of truth (CI sets STRICT_BASE_REF=1 to fail loudly on missing ref).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${HERE}/.." && pwd)"
cd "$ROOT"

BASE_REF="${BASE_REF:-origin/main}"
LEDGER_FILE="${LEDGER_FILE:-crates/mokumo-shop/moon.yml}"
HURL_TREE="${HURL_TREE:-tests/api}"
ROUTES_FILES="${ROUTES_FILES:-crates/mokumo-shop/src/routes.rs}"
ROUTER_FN_SEARCH_DIRS="${ROUTER_FN_SEARCH_DIRS:-crates}"

# Self-test injection points. DIFF_OVERRIDE replaces git diff output;
# ROUTER_FN_OVERRIDE replaces the full grep across crates so fixtures can pin
# a fixed set of fn → file mappings.
DIFF_OVERRIDE="${DIFF_OVERRIDE:-}"
ROUTER_FN_OVERRIDE="${ROUTER_FN_OVERRIDE:-}"

# === Diff acquisition =====================================================

if [[ -n "$DIFF_OVERRIDE" ]]; then
    DIFF=$(cat "$DIFF_OVERRIDE")
else
    if ! git rev-parse --verify --quiet "$BASE_REF" >/dev/null; then
        if [[ "${STRICT_BASE_REF:-0}" == "1" ]]; then
            echo "::error::route-coverage: base ref '$BASE_REF' not found (STRICT_BASE_REF=1)" >&2
            exit 2
        fi
        echo "::warning::route-coverage: base ref '$BASE_REF' not found locally; skipping (run \`git fetch origin main\` to enable)" >&2
        exit 0
    fi
    DIFF=$(git diff --unified=0 "${BASE_REF}...HEAD" -- 'crates/**/src/**/*.rs' 2>/dev/null || true)
fi

if [[ -z "$DIFF" ]]; then
    echo "route-coverage ok: no Rust source changes vs ${BASE_REF}"
    exit 0
fi

# === Phase A: prefix map ==================================================
# Walk routes.rs (or the configured ROUTES_FILES) for `.nest("/api/<prefix>", ... ::<fn>())`
# patterns and build a map: <fn_name> → /api/<prefix>.
# Multi-line .nest() chains are common; we collapse whitespace before matching.

build_prefix_map() {
    local f
    for f in $ROUTES_FILES; do
        [[ -f "$f" ]] || continue
        # Collapse to single line with single-space gaps so a multi-line
        # `.nest(\n    "/api/...",\n    crate::fn(),\n)` becomes greppable.
        tr '\n' ' ' < "$f" | sed -E 's/[[:space:]]+/ /g' \
            | grep -oE '\.nest\( *"/api/[^"]+", *([a-zA-Z_][a-zA-Z0-9_]*::)*[a-zA-Z_][a-zA-Z0-9_]*\(\)' \
            | sed -E 's|^\.nest\( *"(/api/[^"]+)", *([a-zA-Z_][a-zA-Z0-9_]*::)*([a-zA-Z_][a-zA-Z0-9_]*)\(\)$|\3 \1|'
    done | sort -u
}

PREFIX_MAP=$(build_prefix_map)

# === Phase B: router-fn → file map ========================================
# `pub fn <name>(...) -> Router<...>` definitions across the source tree.
# Output: lines of "<fn_name> <file_path>".

build_fn_to_file_map() {
    if [[ -n "$ROUTER_FN_OVERRIDE" ]]; then
        cat "$ROUTER_FN_OVERRIDE"
        return
    fi
    grep -rE '^[[:space:]]*pub fn [a-zA-Z_][a-zA-Z0-9_]*\(' \
        --include='*.rs' \
        $ROUTER_FN_SEARCH_DIRS 2>/dev/null \
        | grep -E '\->[[:space:]]*Router' \
        | sed -E 's|^([^:]+):[[:space:]]*pub fn ([a-zA-Z_][a-zA-Z0-9_]*)\(.*$|\2 \1|' \
        | sort -u
}

FN_TO_FILE_MAP=$(build_fn_to_file_map)

# === Phase C: walk diff for added .route(...) lines =======================
# Extract (METHOD, full_path) pairs. Resolve relative paths via prefix map.

resolve_prefix_for_file() {
    local file="$1"
    [[ -z "$file" ]] && return 1
    while IFS=' ' read -r fn fnfile; do
        [[ "$fnfile" == "$file" ]] || continue
        local prefix
        prefix=$(printf '%s\n' "$PREFIX_MAP" | awk -v fn="$fn" '$1==fn{print $2; exit}')
        if [[ -n "$prefix" ]]; then
            printf '%s' "$prefix"
            return 0
        fi
    done <<< "$FN_TO_FILE_MAP"
    return 1
}

extract_added_routes() {
    local current_file=""
    local line
    while IFS= read -r line; do
        if [[ "$line" =~ ^\+\+\+\ b/(.+)$ ]]; then
            current_file="${BASH_REMATCH[1]}"
            continue
        fi

        # Only added lines (skip removed, context, and metadata).
        [[ "$line" =~ ^\+[^+] ]] || continue

        # Match `.route("<path>", ...)`. Path is everything between the first
        # quoted pair following `.route(`.
        if [[ "$line" =~ \.route\(\"([^\"]+)\" ]]; then
            local path="${BASH_REMATCH[1]}"

            # Extract methods on this line. Common forms:
            #   .route("/x", get(h))                 → GET
            #   .route("/x", get(h).post(j))         → GET, POST
            #   .route("/x", post(create))           → POST
            local methods
            methods=$(printf '%s' "$line" \
                | grep -oE '\b(get|post|put|patch|delete|head|options)\(' \
                | sed 's/(//' \
                | sort -u)
            [[ -z "$methods" ]] && continue

            # Resolve full path.
            local full_path=""
            if [[ "$path" == /api/* ]]; then
                full_path="$path"
            else
                local prefix
                if prefix=$(resolve_prefix_for_file "$current_file"); then
                    if [[ "$path" == "/" ]]; then
                        full_path="$prefix"
                    else
                        full_path="${prefix}${path}"
                    fi
                else
                    # Out of scope: relative path with no resolvable parent
                    # mount. Skip (don't fail) — the route may be intentionally
                    # mounted at a non-`/api/` path, or the mounting site is
                    # added in the same PR (not a v2 case we resolve).
                    continue
                fi
            fi

            local m
            for m in $methods; do
                # ${m^^} is bash 4+; explicit upper-case for portability.
                printf '%s %s\n' "$(printf '%s' "$m" | tr '[:lower:]' '[:upper:]')" "$full_path"
            done
        fi
    done <<< "$DIFF" | sort -u
}

NEW_ENDPOINTS=$(extract_added_routes)

if [[ -z "$NEW_ENDPOINTS" ]]; then
    echo "route-coverage ok: no new (method, /api/...) endpoints introduced in diff"
    exit 0
fi

# === Phase D: coverage check per (METHOD, PATH) ===========================

if [[ -z "$DIFF_OVERRIDE" ]]; then
    NEW_HURL=$(git diff --name-only --diff-filter=A "${BASE_REF}...HEAD" -- "${HURL_TREE}/**/*.hurl" 2>/dev/null || true)
else
    NEW_HURL=""
fi

if [[ -f "$LEDGER_FILE" ]]; then
    LEDGER=$(cat "$LEDGER_FILE")
else
    LEDGER=""
fi

# Convert /api/users/{id}/role → /api/users/[^/]+/role for grep -E.
# Escape regex meta-characters in literal segments first, then replace
# `{<word>}` placeholders with `[^/]+`.
path_to_regex() {
    local p="$1"
    # Escape every regex meta (except { }) so literal segments match
    # themselves. We use single-char character classes `[{]` / `[}]` in the
    # placeholder substitution below to dodge quantifier-interval parsing
    # (`\{m,n\}`) under strict EREs (e.g. GNU sed -E).
    local escaped
    escaped=$(printf '%s' "$p" | sed -E 's|[.*+?^$()\[\]\\]|\\&|g')
    printf '%s' "$escaped" | sed -E 's|[{][a-zA-Z_][a-zA-Z0-9_]*[}]|[^/]+|g'
}

# Returns 0 if the file contains a request line `<METHOD> http(s)?://<host><path>(?|space|EOL)`.
# `<host>` matches any non-space, non-slash run (`{{host}}` template included).
hurl_has_request() {
    local method="$1"
    local path_regex="$2"
    local hurl_file="$3"
    [[ -f "$hurl_file" ]] || return 1
    grep -qE "^${method}[[:space:]]+https?://[^[:space:]/]+${path_regex}(\\?|[[:space:]]|$)" "$hurl_file"
}

# Try every known coverage source for (method, path). Echoes a one-line
# "covered by …" message on success and returns 0; returns 1 otherwise.
method_covered() {
    local method="$1"
    local path="$2"
    local domain
    domain=$(printf '%s' "$path" | sed -E 's|^/api/([^/]+).*$|\1|')
    local path_regex
    path_regex=$(path_to_regex "$path")

    # (a) existing hurl files in domain dir
    if [[ -d "${HURL_TREE}/${domain}" ]]; then
        local f
        while IFS= read -r f; do
            [[ -z "$f" ]] && continue
            if hurl_has_request "$method" "$path_regex" "$f"; then
                printf 'covered by %s' "$f"
                return 0
            fi
        done < <(find "${HURL_TREE}/${domain}" -type f -name '*.hurl' 2>/dev/null)
    fi
    # (a') sibling file at <HURL_TREE>/<domain>.hurl
    if [[ -f "${HURL_TREE}/${domain}.hurl" ]]; then
        if hurl_has_request "$method" "$path_regex" "${HURL_TREE}/${domain}.hurl"; then
            printf 'covered by %s' "${HURL_TREE}/${domain}.hurl"
            return 0
        fi
    fi

    # (b) newly-added hurl files in the same diff
    if [[ -n "$NEW_HURL" ]]; then
        local f
        while IFS= read -r f; do
            [[ -z "$f" ]] && continue
            if hurl_has_request "$method" "$path_regex" "$f"; then
                printf 'covered by new file %s' "$f"
                return 0
            fi
        done <<< "$NEW_HURL"
    fi

    # (c) exclusion ledger: a "<METHOD> <path>" or "<METHOD> <path>(<note>)" line.
    # Match against the path with placeholders treated as `[^/]+` so a ledger
    # entry like "DELETE /api/users/{id}" covers the route literally.
    if printf '%s' "$LEDGER" | grep -qE "(^|[[:space:]])${method}[[:space:]]+${path_regex}([[:space:]]|$|\(|,)"; then
        printf 'in exclusion ledger %s' "$LEDGER_FILE"
        return 0
    fi

    return 1
}

FAIL=0
COVERAGE_MSG=""

while IFS=' ' read -r method path; do
    [[ -z "$method" || -z "$path" ]] && continue
    if COVERAGE_MSG=$(method_covered "$method" "$path"); then
        echo "route-coverage ok: ${method} ${path} (${COVERAGE_MSG})"
    else
        domain=$(printf '%s' "$path" | sed -E 's|^/api/([^/]+).*$|\1|')
        cat <<EOF >&2
::error::route-coverage violation: ${method} ${path}

This PR introduces ${method} ${path} but no .hurl file has a matching
request line. mokumo CLAUDE.md mandates per-endpoint hurl coverage. Add:

  - ${HURL_TREE}/${domain}/<verb>-<slug>.hurl with a "${method} http://{{host}}${path}" line, OR
  - an entry in ${LEDGER_FILE} listing "${method} ${path}" with the reason.

See ~/Github/ops/standards/testing/hurl-conventions.md and
~/.claude/skills/hurl-test-author/ (Mokumo deltas) for the file pattern.
EOF
        FAIL=1
    fi
done <<< "$NEW_ENDPOINTS"

if [[ "$FAIL" -ne 0 ]]; then
    exit 1
fi

echo "route-coverage ok: all new (method, /api/...) endpoints have hurl or ledger coverage"
