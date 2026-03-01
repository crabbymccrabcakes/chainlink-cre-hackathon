# Chainlink Convergence Hackathon Checklist (TypeScript + CRE)

## 0) Environment
- [ ] `bun --version` >= 1.2.21
- [ ] `cre version` works
- [ ] `bun install`
- [ ] `bun run setup`
- [ ] `bun run check`

## 1) CRE account + auth
- [ ] `cre login`
- [ ] `cre whoami`

## 2) Workflow baseline
- [ ] Hello world compiles (`compile:hello`)
- [ ] Block trigger compiles (`compile:block`)
- [ ] Data feeds workflow compiles (`compile:feeds`)

## 3) Data + contracts
- [ ] Confirm testnet RPC URLs in `project.yaml`
- [ ] Validate feed proxy addresses in `read-data-feeds/config.json`
- [ ] Add your target contract addresses (if doing writes)

## 4) Git + CI
- [ ] Set GitHub remote (`scripts/set-github-remote.sh <url>`)
- [ ] Push branch
- [ ] Confirm Actions CI passes

## 5) Demo readiness
- [ ] 60-second architecture pitch
- [ ] 2-minute live demo script
- [ ] fallback recording in case infra is flaky
- [ ] judge-facing README updated with problem, solution, and impact

## 6) Submission package
- [ ] public repo + clear setup steps
- [ ] contract addresses + tx links
- [ ] video walkthrough
- [ ] concise write-up
