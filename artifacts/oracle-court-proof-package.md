# Oracle Court Canonical Proof Package

## One-line Story

Healthy evidence + telemetry enables real mint/redeem execution.
Stressed evidence forces a reverted large-mint transaction under the effective policy mode.
Appeal / retrial records the follow-up execution posture on the upgraded docketed stack.

## Canonical Addresses

- receiverAddress: `0x4f89381387bcc29a4f7d12581314d69fad2bb67d`
- vaultAddress: `0xd5c7fad217fa3b0ba8b03e962723b48aaa153d20`
- execution actor: `0x7cF2523342Bc161dc2ac73D4f354251605675d54`

## Scenario Matrix

| Scenario | Tribunal Tx | Effective Mode | Policy Mode | Risk Score (bps) | Large Mint 5000 | Redeem 1000 |
|---|---|---|---|---:|---|---|
| Scenario A — Healthy evidence and telemetry | 0xc66c3a8acdc86e19ba95e5d879fd748a963a0d8af63f8077e9f1203c76593923 | NORMAL | NORMAL | 5563 | SUCCESS (mint 5000, delta=5000, tx=0x20ce725020e635476b57772b5c7dae0b0630bf1ad6acfcc4de2b9ddd208739fe) | SUCCESS (redeem 1000, delta=-1000, tx=0x80f22e9bfd80eedc3acd674807c3558664badbef30fb2e39420d328114edf9e2) |
| Scenario B — Stressed evidence and telemetry | 0x8831b18c70c477ec20a889bd701753278dd16ccaccdfa89902fce2974d0c3c4f | THROTTLE | THROTTLE | 10000 | REVERTED (mint 5000, tx=0x5cd7ccd06c5ad11e3d8333ae2527a50abcd26ef97ef413982a5c78ccc2f57e2c) | SUCCESS (redeem 1000, delta=-1000, tx=0x16162843eeef745d7c93cb7b6d39f3110d144444ef764c52639a04b7fea43abd) |
| Scenario C — Appeal / retrial evidence and telemetry | 0x4128f84408bb25e7589a1346f1db07eaf825d478500265851a61ef10ef5c3d0d | NORMAL | NORMAL | 5567 | SUCCESS (mint 5000, delta=5000, tx=0x52620c33e483cce65cf591cf6a801ee60d14ea656faea099646df1c09ea55889) | SUCCESS (redeem 1000, delta=-1000, tx=0x2006a30c7899dd70256be9a35c9ed9c0f10ebec2589119f91e56410cfbabf95f) |

## Action Evidence

### Scenario A — Healthy evidence and telemetry

- tribunalTx: `0xc66c3a8acdc86e19ba95e5d879fd748a963a0d8af63f8077e9f1203c76593923`
- effectiveMode: `NORMAL`
- policyMode: `NORMAL`
- mint5000: SUCCESS (mint 5000, delta=5000, tx=0x20ce725020e635476b57772b5c7dae0b0630bf1ad6acfcc4de2b9ddd208739fe)
- redeem1000: SUCCESS (redeem 1000, delta=-1000, tx=0x80f22e9bfd80eedc3acd674807c3558664badbef30fb2e39420d328114edf9e2)

### Scenario B — Stressed evidence and telemetry

- tribunalTx: `0x8831b18c70c477ec20a889bd701753278dd16ccaccdfa89902fce2974d0c3c4f`
- effectiveMode: `THROTTLE`
- policyMode: `THROTTLE`
- mint5000: REVERTED (mint 5000, tx=0x5cd7ccd06c5ad11e3d8333ae2527a50abcd26ef97ef413982a5c78ccc2f57e2c)
- redeem1000: SUCCESS (redeem 1000, delta=-1000, tx=0x16162843eeef745d7c93cb7b6d39f3110d144444ef764c52639a04b7fea43abd)

### Scenario C — Appeal / retrial evidence and telemetry

- tribunalTx: `0x4128f84408bb25e7589a1346f1db07eaf825d478500265851a61ef10ef5c3d0d`
- effectiveMode: `NORMAL`
- policyMode: `NORMAL`
- mint5000: SUCCESS (mint 5000, delta=5000, tx=0x52620c33e483cce65cf591cf6a801ee60d14ea656faea099646df1c09ea55889)
- redeem1000: SUCCESS (redeem 1000, delta=-1000, tx=0x2006a30c7899dd70256be9a35c9ed9c0f10ebec2589119f91e56410cfbabf95f)

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

## Appeal Scenario Inputs

```json
{
  "reserveCoverageBps": 9900,
  "attestationAgeSeconds": 7200,
  "redemptionQueueBps": 700
}
```

## Final Enforced State (after appeal scenario)

```json
{
  "riskMode": 0,
  "throttleMintLimit": "1000",
  "reserveCoverageBps": 9900,
  "attestationAgeSeconds": 7200,
  "redemptionQueueBps": 700,
  "canMint1000": true,
  "canMint5000": true,
  "canRedeem1000": true,
  "totalMinted": "5000",
  "totalRedeemed": "2000",
  "actorState": {
    "actorAddress": "0x7cF2523342Bc161dc2ac73D4f354251605675d54",
    "balance": "3000"
  }
}
```
