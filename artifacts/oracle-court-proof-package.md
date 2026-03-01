# Oracle Court Canonical Proof Package

## One-line Story

Healthy evidence + telemetry keeps policy in `NORMAL`.
Stressed evidence + contradictions escalates policy to `THROTTLE`.
Both verdicts are committed onchain and immediately affect vault mint policy.

## Canonical Addresses

- receiverAddress: `0x874209ec5beaf34c6b570adc7f8f6ea4b01464f9`
- vaultAddress: `0xd730a0f5ef8e419b1dbf3101e019dce9e2c040de`

## Scenario Matrix

| Scenario | Tx Hash | Mode | Risk Score (bps) | canMint5000 | canRedeem1000 |
|---|---|---|---:|---:|---:|
| Scenario A — Healthy evidence and telemetry | 0xf39993d60dec5e885f7eae556c192cbcd1f353171798916fac38cc0da4435a66 | NORMAL | 0 | true | true |
| Scenario B — Stressed evidence and telemetry | 0x116b46285fec8335894c1359556917187a202faffb2379094073ecc22aced23b | THROTTLE | 5969 | false | true |

## Healthy Scenario Inputs

```json
{
  "reserveCoverageBps": 10000,
  "attestationAgeSeconds": 300,
  "redemptionQueueBps": 200
}
```

## Stressed Scenario Inputs

```json
{
  "reserveCoverageBps": 9400,
  "attestationAgeSeconds": 172800,
  "redemptionQueueBps": 2800
}
```

## Final Enforced State (after stressed scenario)

```json
{
  "riskMode": 1,
  "throttleMintLimit": "1000",
  "reserveCoverageBps": 9400,
  "attestationAgeSeconds": 172800,
  "redemptionQueueBps": 2800,
  "canMint1000": true,
  "canMint5000": false,
  "canRedeem1000": true
}
```
