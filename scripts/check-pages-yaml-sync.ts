#!/usr/bin/env tsx
/**
 * Lint: pages.yaml ↔ (app) route folder sync.
 *
 * Fails if:
 *   - A folder under apps/web/src/routes/(app)/ has no matching slug in pages.yaml
 *   - A slug in pages.yaml has no matching folder under apps/web/src/routes/(app)/
 *
 * Usage: pnpm --filter @mokumo/web exec tsx ../../scripts/check-pages-yaml-sync.ts
 *        (or: pnpm tsx scripts/check-pages-yaml-sync.ts from apps/web/)
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const ROUTES_DIR = join(REPO_ROOT, "apps/web/src/routes/(app)");
const PAGES_YAML = join(REPO_ROOT, ".claude/routines/daily-qa/pages.yaml");

// ── Route slugs from filesystem ──────────────────────────────────────────────

let routeSlugs: Set<string>;
try {
  routeSlugs = new Set(
    readdirSync(ROUTES_DIR).filter((name) =>
      statSync(join(ROUTES_DIR, name)).isDirectory()
    )
  );
} catch {
  console.error(`Route directory not found: ${ROUTES_DIR}`);
  console.error("Expected: apps/web/src/routes/(app)/");
  process.exit(1);
}

// ── Slugs from pages.yaml (regex parse — we control the format) ──────────────
//
// Matches YAML lines of the form:
//   "  - slug: customers"
// Indentation and trailing whitespace are trimmed.

let yamlContent: string;
try {
  yamlContent = readFileSync(PAGES_YAML, "utf-8");
} catch {
  console.error(`pages.yaml not found: ${PAGES_YAML}`);
  console.error("Expected: .claude/routines/daily-qa/pages.yaml");
  process.exit(1);
}
const yamlSlugs = new Set(
  [...yamlContent.matchAll(/^\s+-\s+slug:\s+(\S+)/gm)].map((m) => m[1])
);

// ── Diff ─────────────────────────────────────────────────────────────────────

const onlyInRoutes = [...routeSlugs]
  .filter((s) => !yamlSlugs.has(s))
  .sort();

const onlyInYaml = [...yamlSlugs]
  .filter((s) => !routeSlugs.has(s))
  .sort();

let hasError = false;

if (onlyInRoutes.length > 0) {
  console.error(
    `\nRoute folders missing from pages.yaml (${onlyInRoutes.length}):\n` +
      onlyInRoutes.map((s) => `  - ${s}`).join("\n")
  );
  console.error(
    "\nAdd each missing scope to .claude/routines/daily-qa/pages.yaml with enabled: false\n"
  );
  hasError = true;
}

if (onlyInYaml.length > 0) {
  console.error(
    `\npages.yaml slugs with no matching route folder (${onlyInYaml.length}):\n` +
      onlyInYaml.map((s) => `  - ${s}`).join("\n")
  );
  console.error(
    "\nRemove these slugs from pages.yaml or create the matching route folders\n"
  );
  hasError = true;
}

if (!hasError) {
  const count = routeSlugs.size;
  console.log(`pages.yaml sync OK — ${count} scope${count === 1 ? "" : "s"} matched`);
  console.log([...routeSlugs].sort().map((s) => `  ✓ ${s}`).join("\n"));
}

process.exit(hasError ? 1 : 0);
