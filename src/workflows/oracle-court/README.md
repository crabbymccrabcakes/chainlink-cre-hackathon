# Oracle Court Workflow

Oracle Court is a CRE workflow for **constitutional AI risk governance** over tokenized-asset policy.

## Inputs

- Offchain USDC/USD sources (multi-source median + retry + partial tolerance)
- Onchain Chainlink feeds: ETH/USD + BTC/USD on Sepolia
- Onchain RWA telemetry from `MockRWAVault`:
  - `reserveCoverageBps`
  - `attestationAgeSeconds`
  - `redemptionQueueBps`
- Evidence dossier documents from config (`dossier.documents`):
  - reserve attestation text
  - issuer disclosure text
  - governance/custody/incident text

## Processing Stages

1. `dossier.ts` — chunk + claim extraction + contradiction matrix + `evidenceRoot`
2. `tribunal.ts` — Prosecutor/Defender/Auditor adversarial briefs
3. `policy-simulator.ts` — counterfactual scoring of mode outcomes
4. `appeal.ts` — compares prior verdict vs current evidence deltas
5. `index.ts` — deterministic digesting, report signing, onchain write

## Onchain Payload

The report payload sent to `OracleCourtReceiver` remains:

```solidity
(
  uint8 mode,
  uint16 riskScoreBps,
  uint16 prosecutorScore,
  uint16 defenderScore,
  uint16 auditorScore,
  uint32 timestamp,
  bytes32 caseId,
  bytes32 prosecutorEvidenceHash,
  bytes32 defenderEvidenceHash,
  bytes32 auditorEvidenceHash,
  bytes32 verdictDigest
)
```

`OracleCourtReceiver` enforces protocol impact via `MockRWAVault.setRiskMode(mode)`.

## Artifacts

`generate-oracle-court-proof.mjs` produces:

- `artifacts/evidence-dossier.json`
- `artifacts/evidence-dossier.md`
- `artifacts/tribunal-briefs.md`
- `artifacts/policy-simulation.md`
- `artifacts/verdict-bulletin.json`
- `artifacts/oracle-court-proof.md`

## Execution

```bash
bun run deploy:oracle-court:stack
bun run simulate:oracle-court:broadcast
bun run demo:oracle-court:impact
```
