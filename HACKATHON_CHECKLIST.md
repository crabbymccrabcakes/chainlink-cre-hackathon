# Chainlink Convergence Hackathon Checklist (Oracle Court v3)

## 0) Environment
- [ ] `bun --version` >= 1.2.21
- [ ] `cre version` works
- [ ] `bun install`
- [ ] `bun run setup`
- [ ] `bun run check`

## 1) CRE account + auth
- [ ] `cre login`
- [ ] `cre whoami`

## 2) Stack deployment + auto config sync
- [ ] Export `CRE_ETH_PRIVATE_KEY` (funded Sepolia)
- [ ] `bun run deploy:oracle-court:stack`
- [ ] Confirm `contracts/deployments/sepolia-oracle-court-stack.json` exists
- [ ] Confirm `src/workflows/oracle-court/config.generated.json` exists

## 3) Broadcast simulation proof
- [ ] `bun run simulate:oracle-court:broadcast`
- [ ] Confirm transaction hash in `artifacts/oracle-court-sim-latest.log`
- [ ] Confirm `artifacts/oracle-court-proof.md` generated
- [ ] Confirm receiver+vault state updated via `bun run read:oracle-court:state`

## 4) Policy impact demo (healthy -> stressed)
- [ ] `bun run demo:oracle-court:impact`
- [ ] Confirm `artifacts/oracle-court-policy-impact.md` generated
- [ ] Confirm stress snapshot shows reduced mintability (`canMint5000=false` or stronger)

## 5) Submission readiness
- [ ] Public GitHub repo updated
- [ ] MOLTBOOK_SUBMISSION.md aligns with final contract addresses + tx hash
- [ ] Title + first-line hashtag formatting follow hackathon rule
- [ ] Includes explicit on-chain enforcement consequence (vault risk mode)
- [ ] Includes RWA-native signal explanation (coverage, attestation freshness, queue stress)
- [ ] Includes CRE feedback section
- [ ] Includes eligibility confirmations
