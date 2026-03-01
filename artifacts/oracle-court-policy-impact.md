# Oracle Court Policy Impact Demo

This artifact demonstrates **court verdict -> protocol behavior change** under healthy vs stressed RWA telemetry.

## Deterministic Before/After Snapshot

```json
{
  "generatedAtIso": "2026-03-01T04:16:41.535Z",
  "baseline": {
    "telemetry": {
      "reserveCoverageBps": 10000,
      "attestationAgeSeconds": 300,
      "redemptionQueueBps": 200
    },
    "txHash": "0x24e3dbb5ada32ab489c5e8e4119e89f58bd9270814a9bcb42ddc63a4e129944d",
    "receiverState": {
      "latestMode": 0,
      "latestRiskScoreBps": 0,
      "latestProsecutorScore": 7,
      "latestDefenderScore": 499,
      "latestAuditorScore": 3,
      "latestTimestamp": 1772338552,
      "latestCaseId": "0x90663df73205ef96efce782846ee73b07bb60e8c1e57169e01040ebefef75835",
      "latestProsecutorEvidenceHash": "0x6a6c57933105a610fb9c48dd78b2862731554005452a9e97ddac4cf4b04a9602",
      "latestDefenderEvidenceHash": "0xd6ebdd2b129251f075a0b88facc3bf8ff53c19ce71cb2ca58e3f9a1873a8975a",
      "latestAuditorEvidenceHash": "0x9bccca0c2ba928ecd215a0c22180fdaf26f78ebe1aefad0a0e536a288a2dd4bc",
      "latestVerdictDigest": "0xc5b96cd22cd54c3e18b910a973d295d5a4f2f13eade5c38e493865790af8e207"
    },
    "vaultState": {
      "riskMode": 0,
      "throttleMintLimit": "1000",
      "reserveCoverageBps": 10000,
      "attestationAgeSeconds": 300,
      "redemptionQueueBps": 200,
      "canMint1000": true,
      "canMint5000": true,
      "canRedeem1000": true
    }
  },
  "stress": {
    "telemetry": {
      "reserveCoverageBps": 9400,
      "attestationAgeSeconds": 172800,
      "redemptionQueueBps": 2800
    },
    "txHash": "0xd2dde0ed39e31157bee2dd2402a25f77c2ad23317b74044baa0ac65c496361c8",
    "receiverState": {
      "latestMode": 2,
      "latestRiskScoreBps": 9746,
      "latestProsecutorScore": 5327,
      "latestDefenderScore": 404,
      "latestAuditorScore": 4823,
      "latestTimestamp": 1772338590,
      "latestCaseId": "0x6a42f46887659675100e2c1a77a48a53557f80196353a76c2c22db945bb788f0",
      "latestProsecutorEvidenceHash": "0x96dee44f5a18ed1de7ef62c95141c3071bcd21fd1eaed52b9e4f4024ba299542",
      "latestDefenderEvidenceHash": "0xd09e242a2367bac68c95ca986fe7b62fa58cb92d3a52f73db99ea61c3674e2de",
      "latestAuditorEvidenceHash": "0x7c82e9c0973fd77d2ace8dad2d6eac9e976973092bcd85e7ba0a190f47edd31b",
      "latestVerdictDigest": "0xe954e7993a7f7b7ca6256a05cbab817a85e1afdd04ea3bc9fdee8698a21127ee"
    },
    "vaultState": {
      "riskMode": 2,
      "throttleMintLimit": "1000",
      "reserveCoverageBps": 9400,
      "attestationAgeSeconds": 172800,
      "redemptionQueueBps": 2800,
      "canMint1000": false,
      "canMint5000": false,
      "canRedeem1000": true
    }
  }
}
```

## Interpretation

- Baseline run should remain in `NORMAL` with minting enabled.
- Stress run should move to `THROTTLE` or `REDEMPTION_ONLY`, reducing or disabling minting via vault policy.
- Compare `vaultState.canMint5000` across both runs to verify enforceable protocol impact.
