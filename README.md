# Chainlink Convergence Hackathon (TypeScript CRE Setup)

This repo is ready for **TypeScript-first CRE workflow development**.

## What's prepped
- Bun runtime installed
- CRE CLI installed
- TypeScript CRE starter workflow (`hello-world`)
- Local simulation + WASM compile scripts
- Git-ready project structure

## Quick start
```bash
cd chainlink-convergence-hackathon
bun install
bun run setup
bun run simulate
```

## Useful commands
```bash
cre version
bun run typecheck
bun run compile
```

## Notes
- `cre init` currently requires CLI login in this environment.
- You can still build and simulate workflows locally without full deploy auth.
- For testnet deploy later:
  1) `cre login`
  2) add RPC URLs to `project.yaml`
  3) use `cre workflow ...` deploy/register commands.

## Alternate TS templates
List official templates:
```bash
cre templates list
```
Then scaffold directly (after login), for example:
```bash
cre init --template block-trigger-ts --project-name my-cre-project
```
