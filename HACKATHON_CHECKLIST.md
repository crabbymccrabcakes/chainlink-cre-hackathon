# Chainlink Convergence Hackathon Checklist (Oracle Court / CRE)

## 0) Environment
- [ ] `bun --version` >= 1.2.21
- [ ] `cre version` works
- [ ] `bun install`
- [ ] `bun run setup`
- [ ] `bun run check`

## 1) CRE account + auth
- [ ] `cre login`
- [ ] `cre whoami`

## 2) Contract + workflow wiring
- [ ] Deploy `OracleCourtReceiver` on Sepolia (`bun run deploy:oracle-court:receiver`)
- [ ] Update `src/workflows/oracle-court/config.json` receiverAddress
- [ ] Ensure Sepolia RPC URL works in `project.yaml`

## 3) Simulation proof
- [ ] Run one-shot broadcast simulation:
  - `cre workflow simulate ./src/workflows/oracle-court --target local-simulation --non-interactive --trigger-index 0 --broadcast`
- [ ] Capture simulation logs to `artifacts/`
- [ ] Record transaction hash and Sepolia explorer link

## 4) Submission readiness
- [ ] Public GitHub repo with setup steps
- [ ] Exact copy-paste simulation command in submission
- [ ] Explicit on-chain write explanation
- [ ] Evidence artifact with visible tx hash
- [ ] CRE experience feedback section completed
- [ ] Eligibility confirmation section completed
