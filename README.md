# Oracle Court — Verifiable AI Tribunal for RWA Risk (Chainlink CRE)

`#defi-tokenization #cre-ai`

Oracle Court is a deterministic multi-agent workflow that produces **verifiable risk judgments** and enforces protocol behavior on-chain.

Instead of just writing a score, Oracle Court commits:

- 3 structured tribunal arguments (Prosecutor, Defender, Auditor)
- 3 argument evidence hashes
- 1 deterministic verdict digest
- 1 enforceable risk mode (`NORMAL`, `THROTTLE`, `REDEMPTION_ONLY`)

The receiver contract immediately applies that verdict to a mock RWA vault policy surface.

---

## Architecture

```mermaid
flowchart LR
    A[Offchain Sources\nCoinGecko / Coinbase / CoinPaprika / CryptoCompare]
    B[Chainlink Data Feeds\nETH/USD + BTC/USD on Sepolia]
    H[Mock RWA Telemetry\nreserve coverage / attestation age / redemption queue]
    C[CRE Workflow\nOracle Court Tribunal]
    D[Evidence Hashing\nkeccak256(agent argument JSON)]
    E[Verdict Digest\nkeccak256(all evidence + verdict)]
    F[OracleCourtReceiver]
    G[MockRWAVault]

    A --> C
    B --> C
    H --> C
    C --> D
    D --> E
    E --> F
    F -->|setRiskMode(mode)| G
```

---

## Tribunal Model

Each agent produces a deterministic argument object:

```json
{
  "agent": "PROSECUTOR",
  "claim": "Liquidity stress detected above safe minting threshold",
  "metrics": {
    "usdcMedian": 0.99999,
    "depegBps": 12,
    "spreadBps": 7,
    "reserveCoverageBps": 9600,
    "attestationAgeSeconds": 86400,
    "redemptionQueueBps": 2500
  },
  "recommendation": "THROTTLE",
  "confidenceBps": 8700,
  "riskDeltaBps": 220
}
```

Then Oracle Court computes:

1. `prosecutorEvidenceHash = keccak256(stable-json(prosecutorArgument))`
2. `defenderEvidenceHash = keccak256(stable-json(defenderArgument))`
3. `auditorEvidenceHash = keccak256(stable-json(auditorArgument))`
4. `verdictDigest = keccak256(abi.encode(allEvidenceHashes, riskScore, mode, timestamp, caseId))`

All values are written on-chain via CRE report signing + `writeReport`.

---

## RWA-Native Inputs

Oracle Court now consumes explicit RWA telemetry from `MockRWAVault` (read on-chain during each run):

- `reserveCoverageBps` (coverage shortfall penalty)
- `attestationAgeSeconds` (freshness/staleness penalty)
- `redemptionQueueBps` (queue stress penalty)

These inputs are included in agent argument metrics and directly influence prosecutor/auditor risk deltas.

---

## Enforceable Protocol Impact

### Contract 1: `OracleCourtReceiver`
Stores latest tribunal state:

- `latestRiskScoreBps`
- `latestProsecutorScore` / `latestDefenderScore` / `latestAuditorScore`
- `latestProsecutorEvidenceHash` / `latestDefenderEvidenceHash` / `latestAuditorEvidenceHash`
- `latestVerdictDigest`
- `latestCaseId`

### Contract 2: `MockRWAVault`
Receiver calls `vault.setRiskMode(mode)` on every accepted report.

Vault policy effects:

- `NORMAL` → mint + redeem allowed
- `THROTTLE` → mint capped by `throttleMintLimit`
- `REDEMPTION_ONLY` → mint disabled, redeem allowed

This gives a direct **court verdict → protocol behavior** path.

---

## Reliability Features (HTTP)

- Multi-source median over independent providers
- Retry with deterministic backoff logging
- Call-budget guard to avoid capability call-limit failures
- Per-source status logs (`OK`, `FAILED`, `SKIPPED`)
- Continue with partial source availability (`minSuccessfulSources` threshold)

Example logs:

- `[OracleCourt][Source][CoinGecko] ... status=OK ...`
- `[OracleCourt][Source][CoinPaprika] ... status=FAILED ...`
- `[OracleCourt][SourceSummary] successful=3 failed=1 median=...`

---

## Repository Layout

```text
contracts/
  MockRWAVault.sol
  OracleCourtReceiver.sol
  deployments/
    sepolia-oracle-court-stack.json

scripts/
  deploy-oracle-court-stack.mjs
  sync-oracle-court-config.mjs
  set-oracle-court-rwa-telemetry.mjs
  demo-oracle-court-policy-impact.mjs
  generate-oracle-court-proof.mjs
  read-oracle-court-state.mjs

src/workflows/oracle-court/
  index.ts
  workflow.yaml
  config.template.json
  config.generated.json   # generated automatically

artifacts/
  oracle-court-sim-latest.log
  oracle-court-simulation-output.txt
  oracle-court-proof.md
  oracle-court-policy-impact.md
```

---

## One-Shot Reproducible Flow (No Manual Config Edits)

```bash
git clone https://github.com/crabbymccrabcakes/chainlink-cre-hackathon.git
cd chainlink-cre-hackathon
bun install
bun run setup
```

Set required env:

```bash
export CRE_ETH_PRIVATE_KEY="0x<funded-sepolia-private-key>"
# optional:
export SEPOLIA_RPC_URL="https://por.bcy-p.metalhosts.com/cre-alpha/MvqtrdftrbxcP3ZgGBJb3bK5/ethereum/sepolia"
```

Deploy stack + auto-wire config:

```bash
bun run deploy:oracle-court:stack
```

Run broadcast simulation + generate proof artifact:

```bash
bun run simulate:oracle-court:broadcast
```

Read resulting on-chain state:

```bash
bun run read:oracle-court:state
```

Run deterministic policy-impact demo (healthy -> stressed telemetry):

```bash
bun run demo:oracle-court:impact
```

This writes `artifacts/oracle-court-policy-impact.md` with before/after mintability checks.

---

## Dev Commands

```bash
bun run typecheck
bun run compile:oracle-court
bun run check
bun run sync:oracle-court:config
bun run set:oracle-court:rwa
bun run proof:oracle-court
bun run demo:oracle-court:impact
```

---

## Security Note

This repository is optimized for hackathon simulation reproducibility.
Receiver access control should be hardened before production use (trusted forwarder + workflow metadata checks).
