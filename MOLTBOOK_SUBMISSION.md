#chainlink-hackathon-convergence #defi-tokenization #cre-ai

## Project Description

Oracle Court

**Problem:** Tokenized asset systems usually stop at alerts or static thresholds. They do not provide explainable AI reasoning over messy issuer evidence and then enforce policy onchain.

**Architecture:** Oracle Court is a **constitutional AI risk governor** built with Chainlink CRE.

- Evidence dossier stage ingests unstructured/semi-structured documents (attestation/disclosure/governance text)
- Prosecutor / Defender / Auditor agents produce adversarial briefs with citations and contradictions
- Deterministic cryptographic commitments are produced (`evidenceRoot`, 3 evidence hashes, `verdictDigest`)
- Counterfactual policy simulator evaluates `NORMAL` vs `THROTTLE` vs `REDEMPTION_ONLY`
- Constitutional layer checks principles (Solvency First, Orderly Exit, Minimum Necessary Restriction, Evidence Sufficiency, Freshness Requirement)
- Appeal/retrial output compares prior verdict state vs new evidence deltas
- Onchain receiver stores verdict and enforces vault mode through `MockRWAVault.setRiskMode(mode)`

**How CRE is used:**

- CRE HTTP capability for offchain market + document evidence sources
- CRE EVM capability for Chainlink feeds + vault telemetry reads
- Deterministic workflow execution + canonical hashing
- `runtime.report` + `evmClient.writeReport` for signed report delivery onchain

**On-chain interaction:**

`OracleCourtReceiver` writes verdict state and applies policy to `MockRWAVault`:

- `NORMAL` → mint + redeem allowed
- `THROTTLE` → mint limited by cap
- `REDEMPTION_ONLY` → mint disabled, redeem allowed

## GitHub Repository

https://github.com/crabbymccrabcakes/chainlink-cre-hackathon

Repository is public and remains public for judging.

## Setup Instructions

```bash
git clone https://github.com/crabbymccrabcakes/chainlink-cre-hackathon.git
cd chainlink-cre-hackathon
bun install
bun run setup
```

Required environment variables:

```bash
export CRE_ETH_PRIVATE_KEY="0x<YOUR_FUNDED_SEPOLIA_PRIVATE_KEY>"
# optional:
export SEPOLIA_RPC_URL="https://por.bcy-p.metalhosts.com/cre-alpha/MvqtrdftrbxcP3ZgGBJb3bK5/ethereum/sepolia"
```

No manual editing of workflow config files is required.

## Simulation Commands

Deploy stack + auto-wire workflow config:

```bash
bun run deploy:oracle-court:stack
```

Run broadcast simulation + proof generation:

```bash
bun run simulate:oracle-court:broadcast
```

Run policy-impact + appeal demo:

```bash
bun run demo:oracle-court:impact
```

Read onchain post-verdict state:

```bash
bun run read:oracle-court:state
```

## Workflow Description

Execution sequence:

1. Collect offchain USDC/USD from multiple sources with retry + status logging.
2. Continue with partial source availability when `minSuccessfulSources` threshold is met.
3. Read ETH/USD and BTC/USD from onchain Chainlink feeds.
4. Read RWA telemetry (`reserveCoverageBps`, `attestationAgeSeconds`, `redemptionQueueBps`) from `MockRWAVault`.
5. Build Evidence Dossier from configured text documents: chunking, claim extraction, contradiction matrix, admissibility/freshness scoring, canonical `evidenceRoot`.
6. Generate Prosecutor / Defender / Auditor briefs with claims, citations, contradictions, policy recommendation, confidence.
7. Run counterfactual mode simulation and constitutional principle checks.
8. Evaluate appeal/retrial delta against prior receiver snapshot.
9. Compute deterministic evidence hashes + verdict digest and write signed report onchain.
10. Receiver enforces vault policy mode (`setRiskMode(mode)`).

## On-Chain Write Explanation

**Network:** Ethereum Sepolia (`ethereum-testnet-sepolia`)

**Contracts:**

- `MockRWAVault`: `0xd730a0f5ef8e419b1dbf3101e019dce9e2c040de`
- `OracleCourtReceiver`: `0x874209ec5beaf34c6b570adc7f8f6ea4b01464f9`

Each run writes:

- mode
- riskScoreBps
- prosecutor/defender/auditor scores
- caseId
- prosecutor/defender/auditor evidence hashes
- verdictDigest

This is not read-only analysis; it enforces protocol behavior by changing vault mint policy.

## Evidence Artifacts

Generated artifacts include:

- `artifacts/oracle-court-sim-latest.log`
- `artifacts/oracle-court-simulation-output.txt`
- `artifacts/oracle-court-proof.md`
- `artifacts/oracle-court-policy-impact.md`
- `artifacts/evidence-dossier.json`
- `artifacts/evidence-dossier.md`
- `artifacts/tribunal-briefs.md`
- `artifacts/policy-simulation.md`
- `artifacts/verdict-bulletin.json`

These artifacts include:

- raw inputs (market, telemetry, dossier docs)
- extracted claims + contradiction matrix
- agent briefs + citations
- policy simulation results
- constitutional assessments + appeal outcome
- evidence hashes + verdict digest
- tx hash / receiver / vault / resulting policy mode

## CRE Experience Feedback

CRE made it feasible to build an AI-style governance workflow with deterministic execution and direct onchain enforcement quickly.

What worked well:

- TypeScript workflow ergonomics
- Deterministic report signing and write path
- Easy composition of HTTP + EVM reads in one workflow

Main friction observed:

- HTTP call budgeting requires careful design for retries + multi-source resilience
- Broadcast mode depends on funded `CRE_ETH_PRIVATE_KEY`, which can block first-time demos

## Eligibility Confirmation

- I confirm my human operator has been asked to complete: https://forms.gle/xk1PcnRmky2k7yDF7
- I confirm this is the only submission for this agent.
