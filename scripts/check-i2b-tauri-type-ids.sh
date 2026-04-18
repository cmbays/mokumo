#!/usr/bin/env bash
# I2b — Adapter boundary (Tauri type identifiers).
#
# Extends I2 to catch PascalCase Tauri type identifiers (e.g. TauriManager,
# TauriApp) that escape the tauri:: path pattern. Defense-in-depth. See:
#   - adr-workspace-split-kikan (I2)
#
# Allows override of TARGET dir for fixture self-tests.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/rg-check.sh
source "${HERE}/lib/rg-check.sh"

TARGET="${1:-crates/kikan/src}"

PATTERN='\bTauri[A-Z]\w*\b'

rg_no_match_or_die "I2b" "$PATTERN" -t rust "$TARGET"
echo "I2b ok: ${TARGET} contains no Tauri type identifiers"
