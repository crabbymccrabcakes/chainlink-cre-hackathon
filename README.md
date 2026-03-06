# Oracle Court — Constitutional AI Risk Governor for Tokenized Assets (Chainlink CRE)

`#defi-tokenization #cre-ai`

Oracle Court is a **constitutional tribunal workflow** where:

- an AI-style reasoning layer interprets ambiguous issuer evidence,
- CRE deterministically compiles + hashes the reasoning,
- and onchain contracts enforce the selected protocol policy.

This implementation already ships:

- Evidence Dossier generation from unstructured/semi-structured text
- Adversarial Prosecutor / Defender / Auditor briefs with citations
- Contradiction matrix + admissibility/freshness scoring
- Counterfactual policy simulation (`NORMAL`, `THROTTLE`, `REDEMPTION_ONLY`)
- Constitutional principle checks + appeal/retrial delta output
- Onchain verdict commit + vault policy enforcement via `setRiskMode(mode)`
- Onchain case docket keyed by `caseId`, including prior-case and appeal lineage

---

## Latest Sepolia Verification

Current deployed stack:

- `OracleCourtReceiver`: `0x4f89381387bcc29a4f7d12581314d69fad2bb67d`
- `MockRWAVault`: `0xd5c7fad217fa3b0ba8b03e962723b48aaa153d20`

Deployment transactions:

- Vault deploy: `0xd0456fcd929d25923538f42816743d792257e3ff03e67d154d11590af0a7a5a0`
- Receiver deploy: `0x49788a43d88dcc2af47ad95cecdc403aaefc9dfbc27a287813627d14cfb7491f`
- `setCourt`: `0xebffa9a4a84af9fa9eac5a5b87de452f07ff676550daa5436fb0e21704efe135`

Verified tribunal writes:

- Initial case tx: `0x3c30739a08d393a9ebd62c741443604e3567c75c9e81f153b3f603af32f584f0`
- Linked follow-up case tx: `0xce0682cc84d0460812126e3cf8f4c80836c79f7112da592fe5c2afb99f0c637a`

The second case is persisted onchain with:

- `caseId = 0x99777aefdeade5c1a6b59a3d637c334de4c090733fdfd1aff1833e9c78a63566`
- `priorCaseId = 0x77501b708cfe46c615496a84b69e358957b90fa5334406f5122b2b308d8378cf`
- `appealOfCaseId = 0x77501b708cfe46c615496a84b69e358957b90fa5334406f5122b2b308d8378cf`
- `appealOutcome = MAINTAIN`

This confirms the receiver now behaves like a docket, not just a latest-state sink.

---

## Canonical Demo Story (judge quick-pass)

Single before/after narrative used in final proof package:

1. **Healthy evidence + telemetry** (`reserveCoverageBps=10000`, `attestationAgeSeconds=300`, `redemptionQueueBps=200`)
   - mode: `NORMAL`
   - policy effect: minting allowed
2. **Stressed evidence + contradictions** (`reserveCoverageBps=9400`, `attestationAgeSeconds=172800`, `redemptionQueueBps=2800`)
   - mode: `THROTTLE`
   - policy effect: large mint requests blocked (`canMint5000=false`)
3. Verdict is committed onchain and immediately enforced by `OracleCourtReceiver -> MockRWAVault.setRiskMode(mode)`.

Canonical proof files:

- `artifacts/oracle-court-canonical-proof.json`
- `artifacts/oracle-court-proof-package.md`
- `artifacts/oracle-court-policy-impact.md`

---

## Architecture

```mermaid
flowchart LR
    A["Evidence Inputs<br/>attestation | disclosure | governance text"]
    B["Market Inputs<br/>USDC multi-source + Chainlink feeds"]
    C["RWA Telemetry<br/>coverage | attestation age | queue pressure"]
    D["Evidence Dossier<br/>claims + contradictions + evidenceRoot"]
    E["AI Tribunal Briefs<br/>Prosecutor | Defender | Auditor"]
    F["Policy Simulator<br/>NORMAL vs THROTTLE vs REDEMPTION_ONLY"]
    G["Constitution + Appeal Pass<br/>principles + retrial delta"]
    H["Deterministic Hashing<br/>brief hashes + verdictDigest"]
    I["OracleCourtReceiver"]
    J["MockRWAVault"]

    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I -->|setRiskMode| J
```

---

## AI-Native Tribunal Flow

### 1) Evidence Dossier (ambiguity handling)

Oracle Court reads configured dossier documents (`reserveAttestation`, `issuerDisclosure`, `governanceProposal`, etc), chunks them, extracts claims, and builds:

- `claims[]` (topic, polarity, confidence, source IDs)
- `contradictionMatrix[]`
- `admissibilityScoreBps`
- `evidenceFreshnessScoreBps`
- `evidenceRoot` (canonical digest)

### 2) Adversarial briefs

Each agent emits a full brief:

- `position`
- `thesis`
- `claims[]`
- `citations[]`
- `contradictionsFound[]`
- `policyRecommendation`
- `confidenceBps`

Each brief is hashed with stable canonical JSON:

- `prosecutorEvidenceHash`
- `defenderEvidenceHash`
- `auditorEvidenceHash`

### 3) Contradiction analysis

The dossier pass explicitly checks narrative-vs-telemetry conflicts, e.g.:

- “reserves sufficient” vs deteriorating `reserveCoverageBps`
- “redemptions normal” vs high `redemptionQueueBps`
- “fresh attestation” vs stale `attestationAgeSeconds`

### 4) Counterfactual policy simulation

Oracle Court scores all three policy modes and compares:

- solvency protection
- user harm
- false-positive cost
- operational reversibility

The policy simulator produces a provisional mode, then constitutional gates can downgrade enforcement if restrictive action lacks sufficient admissible/fresh evidence.

### 5) Constitutional + appeal layer

Final decision cites principles:

- Solvency First
- Orderly Exit
- Minimum Necessary Restriction
- Evidence Sufficiency
- Freshness Requirement

And emits `appealOutcome` relative to the prior onchain case summary (`ESCALATE` / `RELAX` / `MAINTAIN` / `NO_PRIOR_CASE`).

### 6) Deterministic commit + onchain enforcement

CRE writes a signed report to `OracleCourtReceiver`, which stores verdict state, persists appeal-summary fields (contradiction count/severity, freshness, admissibility), and calls:
- `getCaseSummary(caseId)` exposes the docketed case summary onchain
- `hasCase(caseId)` allows existence checks for audit/replay flows

- `MockRWAVault.setRiskMode(mode)`

Vault behavior:

- `NORMAL` → mint + redeem allowed
- `THROTTLE` → mint limited by `throttleMintLimit`
- `REDEMPTION_ONLY` → mint disabled, redeem allowed

---

## Reliability Features

- Multi-source median for offchain USDC
- Retry with deterministic backoff logging
- Per-source status logs (`OK`, `FAILED`, `SKIPPED`)
- Partial-source tolerance with `minSuccessfulSources`
- Call-budget guard (`maxHttpCalls`)

---

## Repository Layout

```text
contracts/
  MockRWAVault.sol
  OracleCourtReceiver.sol
  deployments/
    sepolia-oracle-court-stack.json

scripts/
  deploy-oracle-court-stack.ts
  sync-oracle-court-config.ts
  set-oracle-court-rwa-telemetry.ts
  demo-oracle-court-policy-impact.ts
  generate-oracle-court-proof.ts
  build-oracle-court-canonical-proof.ts
  read-oracle-court-state.ts

src/workflows/oracle-court/
  index.ts
  canonical.ts
  dossier.ts
  tribunal.ts
  policy-simulator.ts
  appeal.ts
  workflow.yaml
  config.template.json
  config.generated.json   # generated automatically

artifacts/
  oracle-court-sim-latest.log
  oracle-court-simulation-output.txt
  oracle-court-proof.md
  oracle-court-policy-impact.md
  oracle-court-canonical-proof.json
  oracle-court-proof-package.md
  oracle-court-healthy-scenario.json
  oracle-court-stressed-scenario.json
  evidence-dossier.json
  evidence-dossier.md
  tribunal-briefs.md
  policy-simulation.md
  verdict-bulletin.json
  ARTIFACT_MAP.md
```

---

## Reproducible Run (no manual config edits)

```bash
git clone https://github.com/crabbymccrabcakes/chainlink-cre-hackathon.git
cd chainlink-cre-hackathon
bun install
bun run setup
```

Set env:

```bash
export CRE_ETH_PRIVATE_KEY="0x<funded-sepolia-private-key>"
# optional
export SEPOLIA_RPC_URL="https://por.bcy-p.metalhosts.com/cre-alpha/MvqtrdftrbxcP3ZgGBJb3bK5/ethereum/sepolia"
```

Deploy + sync:

```bash
bun run deploy:oracle-court:stack
```

Broadcast simulation + proof artifacts:

```bash
bun run simulate:oracle-court:broadcast
```

Read onchain state:

```bash
bun run read:oracle-court:state
```

Policy-impact + appeal demo:

```bash
bun run demo:oracle-court:impact
```

Build canonical healthy->stressed proof package (used in submission):

```bash
bun scripts/build-oracle-court-canonical-proof.ts
```

---

## Security Note

Current receiver accepts reports for simulation convenience.
Production hardening should gate report delivery by trusted forwarder + workflow metadata policy.
