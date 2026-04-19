# Daily Data-Plane QA Routine

Dormant scaffolding for a daily Claude Routine that cycles through Mokumo's data-plane sidebar
routes one-per-day, drives agent-browser scenarios, and opens human-reviewable PRs.

**Status: DORMANT** — All scopes are `enabled: false`. Activate only after the
[activation gate](../../../../ops/decisions/mokumo/adr-daily-data-plane-qa-routine.md#dormant-on-land)
closes (first M0 dataplane route + seed-demo.ts extension + manual dry-run green).

## Files

| File | Purpose |
|------|---------|
| `pages.yaml` | Rotation manifest — 9 sidebar scopes, each `enabled: false` until M0 routes land |
| `PROMPT.md` | Source of truth for the routine prompt (paste into Anthropic web UI at activation) |
| `README.md` | This file — setup docs and activation checklist |

## agent-browser Setup

agent-browser is **not** committed to this repo. Use upstream's own distribution:

```bash
npm i -g agent-browser
agent-browser install
agent-browser skills get core dogfood
```

Run this once on your local dev machine and once in the routine's cloud environment setup script.
See [agent-browser upstream docs](https://github.com/vercel-labs/agent-browser) for full reference.

## Local Dev Quick-Start (once a dataplane route exists)

```bash
# 1. Install agent-browser (if not already)
npm i -g agent-browser && agent-browser install && agent-browser skills get core dogfood

# 2. Seed the demo DB and start the server
cd apps/web && pnpm tsx scripts/seed-demo.ts
cargo run -p mokumo-server -- serve --port 6565 --db apps/web/scripts/demo.db

# 3. In another terminal — run agent-browser against a specific scope
# (replace 'customers' with the scope you want to test)
agent-browser navigate http://localhost:6565/customers
```

Test credentials (seeded by `seed-demo.ts`):
- Email: `admin@demo.local`
- Password: `demo1234`
- Shop: `Mokumo Prints`

## GitHub Actions

`.github/workflows/daily-qa-routine.yml` fires the routine via `workflow_dispatch`.
The `schedule:` block is commented out — uncomment it at activation.

## Activation Checklist

Before enabling the schedule and unpausing the routine:

- [ ] At least one M0 dataplane route is implemented and reachable via `pnpm dev`
- [ ] `seed-demo.ts` extended for that route's entity fixtures
- [ ] Routine created in Anthropic web UI (paste `PROMPT.md`, configure cloud env)
- [ ] `CLAUDE_ROUTINE_TOKEN` + `CLAUDE_ROUTINE_FIRE_URL` set as repo secrets
- [ ] Manual `workflow_dispatch` dry-run passes end-to-end
- [ ] Christopher reviews first output, confirms format is useful signal
- [ ] Enable corresponding scope in `pages.yaml` (`enabled: true`)
- [ ] Uncomment `schedule:` block in `daily-qa-routine.yml`

## ADR + Pipeline Note

- ADR: `ops/decisions/mokumo/adr-daily-data-plane-qa-routine.md` (status: Proposed)
- Pipeline note: `ops/pipelines/mokumo/mokumo-20260419-daily-qa-routine-spike.md`
