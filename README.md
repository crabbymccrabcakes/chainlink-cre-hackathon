# Oracle Court — Constitutional AI Oracle for RWA Risk (CRE)

`#defi-tokenization #cre-ai`

Oracle Court is a Chainlink CRE workflow that turns multi-source market signals into an enforceable on-chain risk verdict.

## What it does

On each cron execution, the workflow:

1. Fetches USDC/USD signals from three public APIs (CoinGecko, Coinbase, CryptoCompare)
2. Reads ETH/USD and BTC/USD Chainlink Data Feeds on Sepolia
3. Runs a deterministic 3-agent tribunal:
   - **Prosecutor** (risk-up)
   - **Defender** (risk-down)
   - **Auditor** (consistency/safety)
4. Produces a risk mode:
   - `0 = NORMAL`
   - `1 = THROTTLE`
   - `2 = REDEMPTION_ONLY`
5. Performs a CRE on-chain write (`runtime.report` + `evmClient.writeReport`) to `OracleCourtReceiver`

This is an oracle-to-policy control loop: not just alerts, but an enforceable on-chain verdict.

---

## Project layout

```text
contracts/
  OracleCourtReceiver.sol
  deployments/
scripts/
  deploy-oracle-court-receiver.mjs
src/workflows/
  hello-world/
  block-trigger/
  read-data-feeds/
  oracle-court/
```

---

## Prerequisites

- Bun >= 1.2.21
- CRE CLI (`cre version`)
- CRE login (`cre login`)
- Funded Sepolia private key for broadcast simulation

---

## Quick start

```bash
bun install
bun run setup
bun run check
```

---

## Deploy the receiver contract (one-time)

```bash
export CRE_ETH_PRIVATE_KEY="0x<your-funded-sepolia-private-key>"
# Optional override; defaults to project Sepolia RPC
export SEPOLIA_RPC_URL="https://por.bcy-p.metalhosts.com/cre-alpha/MvqtrdftrbxcP3ZgGBJb3bK5/ethereum/sepolia"

bun run deploy:oracle-court:receiver
```

This writes deployment metadata to:

```text
contracts/deployments/sepolia-oracle-court-receiver.json
```

Then copy the deployed contract address into:

```text
src/workflows/oracle-court/config.json -> receiverAddress
```

---

## Simulate Oracle Court with on-chain write

```bash
export CRE_ETH_PRIVATE_KEY="0x<your-funded-sepolia-private-key>"

cre workflow simulate ./src/workflows/oracle-court \
  --target local-simulation \
  --non-interactive \
  --trigger-index 0 \
  --broadcast
```

Expected outcome:

- Workflow logs for tribunal signals/scores
- A real Sepolia transaction hash from `writeReport`

---

## Useful commands

```bash
bun run typecheck
bun run compile:oracle-court
bun run simulate:oracle-court
```

---

## Security note

The demo `OracleCourtReceiver` is intentionally permissive for local simulation speed. For production hardening, gate `onReport` using a trusted forwarder and workflow metadata validation.
