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
2. `tribunal.ts` — deterministic Prosecutor/Defender/Auditor adversarial briefs
3. `model-findings.ts` — optional schema-validated model-generated findings via CRE confidential HTTP
4. `policy-simulator.ts` — counterfactual scoring of mode outcomes
5. `appeal.ts` — compares prior onchain case summary vs current evidence deltas
6. `index.ts` — deterministic digesting, constitutional gating, report signing, onchain write

## Onchain Payload

The report payload sent to `OracleCourtReceiver` includes the enforced mode plus the summary needed for docketing and appeal reconstruction:

```solidity
(
  uint8 mode,
  uint16 riskScoreBps,
  uint16 prosecutorScore,
  uint16 defenderScore,
  uint16 auditorScore,
  uint16 contradictionCount,
  uint16 contradictionSeverityBps,
  uint16 evidenceFreshnessScoreBps,
  uint16 admissibilityScoreBps,
  uint32 timestamp,
  bytes32 caseId,
  bytes32 priorCaseId,
  bytes32 appealOfCaseId,
  uint8 appealOutcome,
  bytes32 prosecutorEvidenceHash,
  bytes32 defenderEvidenceHash,
  bytes32 auditorEvidenceHash,
  bytes32 verdictDigest
)
```

`OracleCourtReceiver` persists that summary in an onchain docket keyed by `caseId`, exposes `getCaseSummary(caseId)`, and enforces protocol impact via `MockRWAVault.setRiskMode(mode)`.

## Artifacts

`generate-oracle-court-proof.ts` produces per-run proof artifacts:

- `artifacts/evidence-dossier.json`
- `artifacts/evidence-dossier.md`
- `artifacts/tribunal-briefs.md` (deterministic briefs + optional model findings)
- `artifacts/policy-simulation.md`
- `artifacts/verdict-bulletin.json`
- `artifacts/oracle-court-proof.md`

`build-oracle-court-canonical-proof.ts` produces the submission-safe canonical package:

- `artifacts/oracle-court-canonical-proof.json`
- `artifacts/oracle-court-proof-package.md`
- `artifacts/oracle-court-policy-impact.md`
- `artifacts/oracle-court-healthy-scenario.json`
- `artifacts/oracle-court-stressed-scenario.json`
- `artifacts/ARTIFACT_MAP.md`

## Execution

```bash
bun run deploy:oracle-court:stack
bun run simulate:oracle-court:broadcast
bun run proof:oracle-court:canonical
```

If `model.enabled=true`, `index.ts` will request the configured API key via `runtime.getSecret(...)`, call the configured OpenAI Responses endpoint through `ConfidentialHTTPClient`, validate all returned claim/contradiction references against the live dossier, attach accepted findings to the agent briefs, and fall back to deterministic-only artifacts on any error.
