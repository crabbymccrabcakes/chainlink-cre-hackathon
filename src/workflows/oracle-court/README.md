# Oracle Court Workflow

Oracle Court is a CRE workflow that implements deterministic multi-agent risk judgment.

## Inputs

- Offchain USDC/USD sources (configured in `config.template.json`)
- Onchain Chainlink feeds: ETH/USD + BTC/USD on Sepolia
- Onchain mock RWA telemetry from `MockRWAVault`:
  - `reserveCoverageBps`
  - `attestationAgeSeconds`
  - `redemptionQueueBps`

## Agent Output

Each run computes three structured arguments:

- Prosecutor
- Defender
- Auditor

Each argument is hashed (`keccak256(stable-json(argument))`) and the workflow computes a final `verdictDigest`.

## Onchain Payload

The report payload sent to `OracleCourtReceiver` is:

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

`OracleCourtReceiver` then calls `MockRWAVault.setRiskMode(mode)`.

## Execution

Use root scripts for reproducible flow:

```bash
bun run deploy:oracle-court:stack
bun run simulate:oracle-court:broadcast
bun run demo:oracle-court:impact
```
