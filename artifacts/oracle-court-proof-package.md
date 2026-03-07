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
| Scenario A — Healthy evidence and telemetry | 0x182d29d3f997e1b903c4e39cd438fafc3a0545b5f7d1b128e20b35e503ca31a8 | NORMAL | NORMAL | 5566 | SUCCESS (mint 5000, delta=5000, tx=0x535e26a7e32168c780f96da19b8d0c35c539d0776117a95db23c97a871f536bd) | SUCCESS (redeem 1000, delta=-1000, tx=0x01431e4d3bce457ae9ed1e10335635be92ce995927cf95a96c365c363cbc3361) |
| Scenario B — Stressed evidence and telemetry | 0xa6e1e02f4c21515c037a1d5ef2ba52b089c5a8c117c576ea140b7ae2b5a7e558 | THROTTLE | THROTTLE | 10000 | REVERTED (mint 5000, tx=0x3cd16554aa2c8e0a178ece4a4c379e39ac9a0293a18735ba5c6117f0056437f4) | SUCCESS (redeem 1000, delta=-1000, tx=0x9470f63c0386513846b78729962004fc660633582511c1e6d73c5bc8c8abc296) |
| Scenario C — Appeal / retrial evidence and telemetry | 0x6dda1f34ccfdd4cd27c94b6ab325292870068d8a206d81eac07dfe85356be44e | NORMAL | NORMAL | 5566 | SUCCESS (mint 5000, delta=5000, tx=0xddb1430ddc97cd0acafe07978dcc7d64ab9ea14e716153c593a2941f75e7d093) | SUCCESS (redeem 1000, delta=-1000, tx=0x54c0548bc37f5b84cac6cd383c849896df5b4cd52dfd3153aff28bca111b242a) |

## Action Evidence

### Scenario A — Healthy evidence and telemetry

- tribunalTx: `0x182d29d3f997e1b903c4e39cd438fafc3a0545b5f7d1b128e20b35e503ca31a8`
- effectiveMode: `NORMAL`
- policyMode: `NORMAL`
- mint5000: SUCCESS (mint 5000, delta=5000, tx=0x535e26a7e32168c780f96da19b8d0c35c539d0776117a95db23c97a871f536bd)
- redeem1000: SUCCESS (redeem 1000, delta=-1000, tx=0x01431e4d3bce457ae9ed1e10335635be92ce995927cf95a96c365c363cbc3361)

### Scenario B — Stressed evidence and telemetry

- tribunalTx: `0xa6e1e02f4c21515c037a1d5ef2ba52b089c5a8c117c576ea140b7ae2b5a7e558`
- effectiveMode: `THROTTLE`
- policyMode: `THROTTLE`
- mint5000: REVERTED (mint 5000, tx=0x3cd16554aa2c8e0a178ece4a4c379e39ac9a0293a18735ba5c6117f0056437f4)
- redeem1000: SUCCESS (redeem 1000, delta=-1000, tx=0x9470f63c0386513846b78729962004fc660633582511c1e6d73c5bc8c8abc296)

### Scenario C — Appeal / retrial evidence and telemetry

- tribunalTx: `0x6dda1f34ccfdd4cd27c94b6ab325292870068d8a206d81eac07dfe85356be44e`
- effectiveMode: `NORMAL`
- policyMode: `NORMAL`
- mint5000: SUCCESS (mint 5000, delta=5000, tx=0xddb1430ddc97cd0acafe07978dcc7d64ab9ea14e716153c593a2941f75e7d093)
- redeem1000: SUCCESS (redeem 1000, delta=-1000, tx=0x54c0548bc37f5b84cac6cd383c849896df5b4cd52dfd3153aff28bca111b242a)

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

## Final Enforced State (after appeal post-verdict actions)

```json
{
  "riskMode": 0,
  "throttleMintLimit": "1000",
  "reserveCoverageBps": 9900,
  "attestationAgeSeconds": 7200,
  "redemptionQueueBps": 700,
  "canMintAmount": true,
  "canRedeemAmount": true,
  "actorBalance": "14000",
  "totalMinted": "20000",
  "totalRedeemed": "6000"
}
```
