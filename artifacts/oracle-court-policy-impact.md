# Oracle Court Policy Impact (Canonical)

This artifact uses a judge-scannable execution flow.

- Healthy: tribunal write followed by successful user actions.
- Stressed: tribunal write followed by an onchain large-mint revert under the effective restriction.
- Appeal: tribunal write followed by a second execution check on the linked follow-up case.

## Snapshot

```json
{
  "packageVersion": "oracle-court-canonical-proof-v2",
  "generatedAtIso": "2026-03-07T00:19:05.393Z",
  "story": "healthy verdict enables mint/redeem, stressed verdict produces a reverted large-mint proof onchain, appeal/retrial records the follow-up execution posture onchain",
  "receiverAddress": "0x4f89381387bcc29a4f7d12581314d69fad2bb67d",
  "vaultAddress": "0xd5c7fad217fa3b0ba8b03e962723b48aaa153d20",
  "scenarios": {
    "healthy": {
      "title": "Scenario A — Healthy evidence and telemetry",
      "txHash": "0x182d29d3f997e1b903c4e39cd438fafc3a0545b5f7d1b128e20b35e503ca31a8",
      "modeLabel": "NORMAL",
      "mode": 0,
      "policyModeLabel": "NORMAL",
      "policyMode": 0,
      "riskScoreBps": 5566,
      "evidenceRoot": "0x2ae1a0624a9718aeddb75fc84b620987fbeefd112da55b0d2e2e6bdbb882167d",
      "verdictDigest": "0x16122f2aba17e3bd7169ac36386046247f6b5bcb676d972e6fa87df4cb98196d",
      "actionProof": {
        "actorAddress": "0x7cF2523342Bc161dc2ac73D4f354251605675d54",
        "vaultAddress": "0xd5c7fad217fa3b0ba8b03e962723b48aaa153d20",
        "outcomes": [
          {
            "label": "healthy-mint-5000",
            "kind": "mint",
            "amount": "5000",
            "expectedStatus": "SUCCESS",
            "status": "SUCCESS",
            "txHash": "0x535e26a7e32168c780f96da19b8d0c35c539d0776117a95db23c97a871f536bd",
            "blockNumber": "10399292",
            "error": null,
            "actorBalanceDelta": "5000",
            "totalMintedDelta": "5000",
            "totalRedeemedDelta": "0",
            "before": {
              "riskMode": 0,
              "throttleMintLimit": "1000",
              "reserveCoverageBps": 10000,
              "attestationAgeSeconds": 300,
              "redemptionQueueBps": 200,
              "canMintAmount": true,
              "canRedeemAmount": true,
              "actorBalance": "7000",
              "totalMinted": "10000",
              "totalRedeemed": "3000"
            },
            "after": {
              "riskMode": 0,
              "throttleMintLimit": "1000",
              "reserveCoverageBps": 10000,
              "attestationAgeSeconds": 300,
              "redemptionQueueBps": 200,
              "canMintAmount": true,
              "canRedeemAmount": true,
              "actorBalance": "12000",
              "totalMinted": "15000",
              "totalRedeemed": "3000"
            }
          },
          {
            "label": "healthy-redeem-1000",
            "kind": "redeem",
            "amount": "1000",
            "expectedStatus": "SUCCESS",
            "status": "SUCCESS",
            "txHash": "0x01431e4d3bce457ae9ed1e10335635be92ce995927cf95a96c365c363cbc3361",
            "blockNumber": "10399293",
            "error": null,
            "actorBalanceDelta": "-1000",
            "totalMintedDelta": "0",
            "totalRedeemedDelta": "1000",
            "before": {
              "riskMode": 0,
              "throttleMintLimit": "1000",
              "reserveCoverageBps": 10000,
              "attestationAgeSeconds": 300,
              "redemptionQueueBps": 200,
              "canMintAmount": true,
              "canRedeemAmount": true,
              "actorBalance": "12000",
              "totalMinted": "15000",
              "totalRedeemed": "3000"
            },
            "after": {
              "riskMode": 0,
              "throttleMintLimit": "1000",
              "reserveCoverageBps": 10000,
              "attestationAgeSeconds": 300,
              "redemptionQueueBps": 200,
              "canMintAmount": true,
              "canRedeemAmount": true,
              "actorBalance": "11000",
              "totalMinted": "15000",
              "totalRedeemed": "4000"
            }
          }
        ],
        "finalState": {
          "riskMode": 0,
          "throttleMintLimit": "1000",
          "reserveCoverageBps": 10000,
          "attestationAgeSeconds": 300,
          "redemptionQueueBps": 200,
          "canMintAmount": true,
          "canRedeemAmount": true,
          "actorBalance": "11000",
          "totalMinted": "15000",
          "totalRedeemed": "4000"
        }
      },
      "vaultState": {
        "riskMode": 0,
        "throttleMintLimit": "1000",
        "reserveCoverageBps": 10000,
        "attestationAgeSeconds": 300,
        "redemptionQueueBps": 200,
        "canMint1000": true,
        "canMint5000": true,
        "canRedeem1000": true,
        "totalMinted": "10000",
        "totalRedeemed": "3000",
        "actorState": {
          "actorAddress": "0x7cF2523342Bc161dc2ac73D4f354251605675d54",
          "balance": "7000"
        }
      },
      "postActionVaultState": {
        "riskMode": 0,
        "throttleMintLimit": "1000",
        "reserveCoverageBps": 10000,
        "attestationAgeSeconds": 300,
        "redemptionQueueBps": 200,
        "canMintAmount": true,
        "canRedeemAmount": true,
        "actorBalance": "11000",
        "totalMinted": "15000",
        "totalRedeemed": "4000"
      }
    },
    "stressed": {
      "title": "Scenario B — Stressed evidence and telemetry",
      "txHash": "0xa6e1e02f4c21515c037a1d5ef2ba52b089c5a8c117c576ea140b7ae2b5a7e558",
      "modeLabel": "THROTTLE",
      "mode": 1,
      "policyModeLabel": "THROTTLE",
      "policyMode": 1,
      "riskScoreBps": 10000,
      "evidenceRoot": "0xad6d64973c5a2dda584dd4fb55f0ec4ecf0e350eae8504d62043084a9a7c1bf7",
      "verdictDigest": "0x6de6f95e47d040e578f6e7e2afc69284bbfc6f84c7148c06b13aa708bc6750f8",
      "actionProof": {
        "actorAddress": "0x7cF2523342Bc161dc2ac73D4f354251605675d54",
        "vaultAddress": "0xd5c7fad217fa3b0ba8b03e962723b48aaa153d20",
        "outcomes": [
          {
            "label": "stressed-mint-5000",
            "kind": "mint",
            "amount": "5000",
            "expectedStatus": "REVERTED",
            "status": "REVERTED",
            "txHash": "0x3cd16554aa2c8e0a178ece4a4c379e39ac9a0293a18735ba5c6117f0056437f4",
            "blockNumber": "10399297",
            "error": "Transaction reverted onchain",
            "actorBalanceDelta": "0",
            "totalMintedDelta": "0",
            "totalRedeemedDelta": "0",
            "before": {
              "riskMode": 1,
              "throttleMintLimit": "1000",
              "reserveCoverageBps": 9400,
              "attestationAgeSeconds": 172800,
              "redemptionQueueBps": 2800,
              "canMintAmount": false,
              "canRedeemAmount": true,
              "actorBalance": "11000",
              "totalMinted": "15000",
              "totalRedeemed": "4000"
            },
            "after": {
              "riskMode": 1,
              "throttleMintLimit": "1000",
              "reserveCoverageBps": 9400,
              "attestationAgeSeconds": 172800,
              "redemptionQueueBps": 2800,
              "canMintAmount": false,
              "canRedeemAmount": true,
              "actorBalance": "11000",
              "totalMinted": "15000",
              "totalRedeemed": "4000"
            }
          },
          {
            "label": "stressed-redeem-1000",
            "kind": "redeem",
            "amount": "1000",
            "expectedStatus": "SUCCESS",
            "status": "SUCCESS",
            "txHash": "0x9470f63c0386513846b78729962004fc660633582511c1e6d73c5bc8c8abc296",
            "blockNumber": "10399298",
            "error": null,
            "actorBalanceDelta": "-1000",
            "totalMintedDelta": "0",
            "totalRedeemedDelta": "1000",
            "before": {
              "riskMode": 1,
              "throttleMintLimit": "1000",
              "reserveCoverageBps": 9400,
              "attestationAgeSeconds": 172800,
              "redemptionQueueBps": 2800,
              "canMintAmount": true,
              "canRedeemAmount": true,
              "actorBalance": "11000",
              "totalMinted": "15000",
              "totalRedeemed": "4000"
            },
            "after": {
              "riskMode": 1,
              "throttleMintLimit": "1000",
              "reserveCoverageBps": 9400,
              "attestationAgeSeconds": 172800,
              "redemptionQueueBps": 2800,
              "canMintAmount": true,
              "canRedeemAmount": true,
              "actorBalance": "10000",
              "totalMinted": "15000",
              "totalRedeemed": "5000"
            }
          }
        ],
        "finalState": {
          "riskMode": 1,
          "throttleMintLimit": "1000",
          "reserveCoverageBps": 9400,
          "attestationAgeSeconds": 172800,
          "redemptionQueueBps": 2800,
          "canMintAmount": true,
          "canRedeemAmount": true,
          "actorBalance": "10000",
          "totalMinted": "15000",
          "totalRedeemed": "5000"
        }
      },
      "vaultState": {
        "riskMode": 1,
        "throttleMintLimit": "1000",
        "reserveCoverageBps": 9400,
        "attestationAgeSeconds": 172800,
        "redemptionQueueBps": 2800,
        "canMint1000": true,
        "canMint5000": false,
        "canRedeem1000": true,
        "totalMinted": "15000",
        "totalRedeemed": "4000",
        "actorState": {
          "actorAddress": "0x7cF2523342Bc161dc2ac73D4f354251605675d54",
          "balance": "11000"
        }
      },
      "postActionVaultState": {
        "riskMode": 1,
        "throttleMintLimit": "1000",
        "reserveCoverageBps": 9400,
        "attestationAgeSeconds": 172800,
        "redemptionQueueBps": 2800,
        "canMintAmount": true,
        "canRedeemAmount": true,
        "actorBalance": "10000",
        "totalMinted": "15000",
        "totalRedeemed": "5000"
      }
    },
    "appeal": {
      "title": "Scenario C — Appeal / retrial evidence and telemetry",
      "txHash": "0x6dda1f34ccfdd4cd27c94b6ab325292870068d8a206d81eac07dfe85356be44e",
      "modeLabel": "NORMAL",
      "mode": 0,
      "policyModeLabel": "NORMAL",
      "policyMode": 0,
      "riskScoreBps": 5566,
      "evidenceRoot": "0xef78a6c4bf8d50b44a7616f4425bf23e71f00096afc4a85a1f3c3b2c47bb2421",
      "verdictDigest": "0x1e872f21103900c102d30dd08a9cf4c5813e8efd91e64860946eef97f47bae01",
      "actionProof": {
        "actorAddress": "0x7cF2523342Bc161dc2ac73D4f354251605675d54",
        "vaultAddress": "0xd5c7fad217fa3b0ba8b03e962723b48aaa153d20",
        "outcomes": [
          {
            "label": "appeal-mint-5000",
            "kind": "mint",
            "amount": "5000",
            "expectedStatus": "SUCCESS",
            "status": "SUCCESS",
            "txHash": "0xddb1430ddc97cd0acafe07978dcc7d64ab9ea14e716153c593a2941f75e7d093",
            "blockNumber": "10399302",
            "error": null,
            "actorBalanceDelta": "5000",
            "totalMintedDelta": "5000",
            "totalRedeemedDelta": "0",
            "before": {
              "riskMode": 0,
              "throttleMintLimit": "1000",
              "reserveCoverageBps": 9900,
              "attestationAgeSeconds": 7200,
              "redemptionQueueBps": 700,
              "canMintAmount": true,
              "canRedeemAmount": true,
              "actorBalance": "10000",
              "totalMinted": "15000",
              "totalRedeemed": "5000"
            },
            "after": {
              "riskMode": 0,
              "throttleMintLimit": "1000",
              "reserveCoverageBps": 9900,
              "attestationAgeSeconds": 7200,
              "redemptionQueueBps": 700,
              "canMintAmount": true,
              "canRedeemAmount": true,
              "actorBalance": "15000",
              "totalMinted": "20000",
              "totalRedeemed": "5000"
            }
          },
          {
            "label": "appeal-redeem-1000",
            "kind": "redeem",
            "amount": "1000",
            "expectedStatus": "SUCCESS",
            "status": "SUCCESS",
            "txHash": "0x54c0548bc37f5b84cac6cd383c849896df5b4cd52dfd3153aff28bca111b242a",
            "blockNumber": "10399303",
            "error": null,
            "actorBalanceDelta": "-1000",
            "totalMintedDelta": "0",
            "totalRedeemedDelta": "1000",
            "before": {
              "riskMode": 0,
              "throttleMintLimit": "1000",
              "reserveCoverageBps": 9900,
              "attestationAgeSeconds": 7200,
              "redemptionQueueBps": 700,
              "canMintAmount": true,
              "canRedeemAmount": true,
              "actorBalance": "15000",
              "totalMinted": "20000",
              "totalRedeemed": "5000"
            },
            "after": {
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
          }
        ],
        "finalState": {
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
      },
      "vaultState": {
        "riskMode": 0,
        "throttleMintLimit": "1000",
        "reserveCoverageBps": 9900,
        "attestationAgeSeconds": 7200,
        "redemptionQueueBps": 700,
        "canMint1000": true,
        "canMint5000": true,
        "canRedeem1000": true,
        "totalMinted": "15000",
        "totalRedeemed": "5000",
        "actorState": {
          "actorAddress": "0x7cF2523342Bc161dc2ac73D4f354251605675d54",
          "balance": "10000"
        }
      },
      "postActionVaultState": {
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
    }
  }
}
```
