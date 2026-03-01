# Chainlink Convergence Hackathon — TypeScript CRE Starter Kit

This repo is now set up for **fast hackathon execution** with a TypeScript-first CRE workflow stack.

## Included starters

- `hello-world` — minimal cron workflow for smoke testing
- `block-trigger` — EVM log-triggered workflow (event-driven)
- `read-data-feeds` — reads Chainlink Data Feeds on a schedule

## Project layout

```text
src/workflows/
  hello-world/
  block-trigger/
  read-data-feeds/
.github/workflows/ci.yml
HACKATHON_CHECKLIST.md
```

## Quick start

```bash
bun install
bun run setup
bun run check
```

> Note: `cre workflow simulate` and deployment commands require `cre login`.

## Commands

```bash
# Setup
bun run setup

# Validate
bun run typecheck
bun run compile:all
bun run check

# Simulate (after cre login)
bun run simulate:hello
bun run simulate:block
bun run simulate:feeds
```

## GitHub remote setup

Use the helper script from repo root:

```bash
./scripts/set-github-remote.sh <github-repo-url>
```

Then:

```bash
git push -u origin main
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs:
1. `bun install --frozen-lockfile`
2. `bun run setup`
3. `bun run typecheck`
4. `bun run compile:all`

## Hackathon execution plan (high level)

1. Pick one starter as your base (likely `read-data-feeds` + custom logic).
2. Add your differentiator (automation, cross-chain action, agent loop, etc.).
3. Keep the demo path short and deterministic.
4. Ensure CI green + reproducible setup.
5. Ship the pitch + demo + repo before polishing extras.

For action items, use `HACKATHON_CHECKLIST.md`.
