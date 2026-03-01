# Oracle Court (CRE Workflow)

Oracle Court is a constitutional AI oracle pattern for tokenized-asset risk management.

On each cron execution, the workflow:

1. Fetches USDC/USD signals from three public APIs (CoinGecko, Coinbase, CryptoCompare)
2. Reads ETH/USD and BTC/USD Chainlink Data Feeds on Sepolia
3. Runs a 3-agent tribunal model:
   - **Prosecutor** (risk-up)
   - **Defender** (risk-down)
   - **Auditor** (consistency/safety)
4. Produces a deterministic verdict (`NORMAL`, `THROTTLE`, `REDEMPTION_ONLY`)
5. Performs an on-chain write via CRE `writeReport` to `OracleCourtReceiver`

The verdict struct written onchain is:

```solidity
(uint8 mode, uint16 stressBps, uint32 timestamp, bytes32 caseId)
```

Mode mapping:

- `0` = NORMAL
- `1` = THROTTLE
- `2` = REDEMPTION_ONLY
