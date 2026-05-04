#!/usr/bin/env bash
# Structural assertions on the rendered sticky-comment markdown. Run
# by .github/workflows/scorecard-e2e.yml after the producer →
# injector → validator → renderer pipeline writes its output.
#
# Each check exits non-zero on regression so the workflow's verdict
# surfaces the breach rather than printing a green check on a broken
# wire.
set -euo pipefail

MD=tmp/scorecard-rendered.md

if [ ! -f "$MD" ]; then
  echo "::error::expected rendered markdown at $MD"
  exit 1
fi

# Sticky marker — without it, the comment poster cannot recognize and
# update its own previous comment.
if ! grep -q '<!-- ci-scorecard -->' "$MD"; then
  echo "::error::sticky comment marker missing"
  exit 1
fi

# Status banner — the V1 affordance reviewers anchor on at a glance.
if ! grep -qE 'CI status: (Green|Yellow|Red)' "$MD"; then
  echo "::error::status banner missing"
  exit 1
fi

# Two-click rule (V5): at least one row's status icon is wrapped in a
# markdown link to a Check Run URL. Pattern matches the linked-icon
# table-row prefix `| [<icon>](http...`.
if ! grep -qE '\| \[(🟢|🟡|🔴|⏳)\]\(https?://' "$MD"; then
  echo "::error::no row icon was wrapped in a markdown link"
  exit 1
fi

# Defense in depth (V5): no raw <script tags from a hostile fixture
# ever survive the schema validator into the rendered output.
if grep -qF '<script' "$MD"; then
  echo "::error::raw <script tag in rendered output (XSS regression)"
  exit 1
fi

# Rollup exclusion: the verdict job's own name must never appear as a
# scorecard row label. The injector filters it out before slicing —
# this assertion catches regressions in the filter.
if grep -qF "| ${ROLLUP_NAME:-Quality Loop (rollup)} |" "$MD"; then
  echo "::error::rollup verdict was not filtered before rendering"
  exit 1
fi

echo "structural invariants pass"
