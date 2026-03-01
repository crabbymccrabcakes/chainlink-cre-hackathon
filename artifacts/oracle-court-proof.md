# Oracle Court Proof Artifact

## Deployed Receiver Contract (Sepolia)

- Contract: `OracleCourtReceiver`
- Address: `0xed32426e3315cb1acf830f801cf1de6b52be959e`
- Deploy Tx: `0x35a8bb14b1b21115a2baca53ea6b99d3fac6b6d01fd579604ff0738a0acc21bb`

## Broadcast Simulation Run (CRE)

Command used:

```bash
CRE_ETH_PRIVATE_KEY=0x<redacted> \
cre workflow simulate ./src/workflows/oracle-court \
  --target local-simulation \
  --non-interactive \
  --trigger-index 0 \
  --broadcast
```

Result tx hash (on-chain write):

`0x7b63b4c616568c6714aa7014a7d7f9fb929c173d2d443156bacaeab19fbb29cf`

Case ID emitted in simulation:

`0x69db8bf364110ffc48d621c6469a4898b1d8dec211d37f52979516a9bbedcf91`

See full logs in:

- `artifacts/oracle-court-sim-latest.log`
- `artifacts/oracle-court-simulation-output.txt`
