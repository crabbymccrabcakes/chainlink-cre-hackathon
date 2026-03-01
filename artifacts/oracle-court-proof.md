# Oracle Court Proof Artifact

## Deterministic Proof Block

```json
{
  "proofVersion": "oracle-court-v3",
  "generatedAtIso": "2026-03-01T04:16:39.876Z",
  "simulationTimestamp": "2026-03-01T14:16:37Z",
  "txHash": "0xd2dde0ed39e31157bee2dd2402a25f77c2ad23317b74044baa0ac65c496361c8",
  "blockNumber": "10359146",
  "chainId": 11155111,
  "receiverAddress": "0x874209ec5beaf34c6b570adc7f8f6ea4b01464f9",
  "vaultAddress": "0xd730a0f5ef8e419b1dbf3101e019dce9e2c040de",
  "inputValues": {
    "offchain": {
      "usdcMedian": 1,
      "usdcMin": 0.999874,
      "usdcMax": 1.00022161,
      "usdc24hChangePct": -0.012381,
      "successfulSourceCount": 4,
      "failedSourceCount": 0,
      "httpCallsUsed": 4,
      "httpCallsMax": 5
    },
    "onchain": {
      "ethUsd": 2034.62,
      "btcUsd": 67522.82
    },
    "rwa": {
      "reserveCoverageBps": 9400,
      "attestationAgeSeconds": 172800,
      "redemptionQueueBps": 2800
    }
  },
  "agentArguments": {
    "prosecutor": {
      "agent": "PROSECUTOR",
      "claim": "Liquidity + reserve stress detected above safe minting threshold",
      "confidenceBps": 9900,
      "metrics": {
        "attestationAgeSeconds": 172800,
        "attestationLagPenaltyBps": 1320,
        "btcUsd": 67522.82,
        "depegBps": 0,
        "downside24hBps": 1,
        "ethUsd": 2034.62,
        "redemptionQueueBps": 2800,
        "redemptionQueuePenaltyBps": 3000,
        "reserveCoverageBps": 9400,
        "reserveCoverageGapBps": 500,
        "sourceFailures": 0,
        "spreadBps": 3,
        "usdcMedian": 1
      },
      "recommendation": "REDEMPTION_ONLY",
      "riskDeltaBps": 5327
    },
    "defender": {
      "agent": "DEFENDER",
      "claim": "Observed variance appears bounded; avoid over-restrictive policy",
      "confidenceBps": 5808,
      "metrics": {
        "attestationAgeSeconds": 172800,
        "change24hPct": -0.012381,
        "failedSources": 0,
        "redemptionQueueBps": 2800,
        "reserveCoverageBps": 9400,
        "spreadBps": 3,
        "successfulSources": 4,
        "usdcMedian": 1
      },
      "recommendation": "REDEMPTION_ONLY",
      "riskDeltaBps": -404
    },
    "auditor": {
      "agent": "AUDITOR",
      "claim": "Data and/or RWA control signals show elevated operational risk; apply safety premium",
      "confidenceBps": 9900,
      "metrics": {
        "attestationAgeSeconds": 172800,
        "attestationLagPenaltyBps": 1320,
        "depegBps": 0,
        "macroStressBps": 0,
        "redemptionQueueBps": 2800,
        "redemptionQueuePenaltyBps": 3000,
        "reserveCoverageBps": 9400,
        "reserveCoverageGapBps": 500,
        "sourceFailurePenaltyBps": 0,
        "sourceFailures": 0,
        "spreadBps": 3,
        "successfulSources": 4
      },
      "recommendation": "REDEMPTION_ONLY",
      "riskDeltaBps": 4823
    }
  },
  "agentScores": {
    "prosecutorScore": 5327,
    "defenderScore": 404,
    "auditorScore": 4823,
    "riskScoreBps": 9746
  },
  "evidenceHashes": {
    "prosecutorEvidenceHash": "0x96dee44f5a18ed1de7ef62c95141c3071bcd21fd1eaed52b9e4f4024ba299542",
    "defenderEvidenceHash": "0xd09e242a2367bac68c95ca986fe7b62fa58cb92d3a52f73db99ea61c3674e2de",
    "auditorEvidenceHash": "0x7c82e9c0973fd77d2ace8dad2d6eac9e976973092bcd85e7ba0a190f47edd31b",
    "verdictDigest": "0xe954e7993a7f7b7ca6256a05cbab817a85e1afdd04ea3bc9fdee8698a21127ee"
  },
  "finalVerdict": {
    "mode": 2,
    "modeLabel": "REDEMPTION_ONLY",
    "caseId": "0x6a42f46887659675100e2c1a77a48a53557f80196353a76c2c22db945bb788f0",
    "txHash": "0xd2dde0ed39e31157bee2dd2402a25f77c2ad23317b74044baa0ac65c496361c8"
  },
  "onchainState": {
    "receiver": {
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
    "vault": {
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

## Notes

- Receiver enforces protocol consequence by calling `MockRWAVault.setRiskMode(mode)` from each accepted tribunal report.
- Risk mode policy on the vault:
  - `NORMAL` => mint + redeem allowed
  - `THROTTLE` => mint limited by `throttleMintLimit`
  - `REDEMPTION_ONLY` => mint disabled, redeem allowed
- Source execution details are logged in `artifacts/oracle-court-sim-latest.log`.
- RWA telemetry inputs (reserve coverage, attestation age, redemption queue pressure) are included in `inputValues.rwa` and reflected in tribunal arguments.
