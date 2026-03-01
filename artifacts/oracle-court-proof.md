# Oracle Court Proof Artifact

## Deterministic Proof Block

```json
{
  "proofVersion": "oracle-court-ai-governor-v1",
  "generatedAtIso": "2026-03-01T05:39:22.724Z",
  "txHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "blockNumber": null,
  "chainId": 11155111,
  "receiverAddress": "0x874209ec5beaf34c6b570adc7f8f6ea4b01464f9",
  "vaultAddress": "0xd730a0f5ef8e419b1dbf3101e019dce9e2c040de",
  "inputValues": null,
  "evidenceDossierSummary": {
    "admissibilityScoreBps": 8681,
    "claimCount": 3,
    "contradictionCount": 1,
    "evidenceFreshnessScoreBps": 9221,
    "evidenceRoot": "0x43c3c853838cbdd7a8074d1d64caf54ee1d4be184754ee5d2d6ba15eee1f60ec",
    "generatedAtUnix": 1772343560,
    "protectedSourcesPresent": true,
    "sourceIds": [
      "ATT-2026-02-28",
      "DISC-2026-02-28",
      "GOV-2026-02-27"
    ]
  },
  "evidenceDossier": {
    "admissibilityScoreBps": 8681,
    "claimCount": 3,
    "contradictionCount": 1,
    "evidenceFreshnessScoreBps": 9221,
    "evidenceRoot": "0x43c3c853838cbdd7a8074d1d64caf54ee1d4be184754ee5d2d6ba15eee1f60ec",
    "generatedAtUnix": 1772343560,
    "protectedSourcesPresent": true,
    "sourceIds": [
      "ATT-2026-02-28",
      "DISC-2026-02-28",
      "GOV-2026-02-27"
    ],
    "claims": [
      {
        "chunkId": "ATT-2026-02-28-chunk-1",
        "claimId": "CLM-1",
        "confidenceBps": 6834,
        "polarity": "adverse",
        "sourceId": "ATT-2026-02-28",
        "textSnippet": "Independent attestation states reserves are sufficient and fully backed as of Friday close. Coverage remained within internal tolerance, ...",
        "topic": "reserves"
      },
      {
        "chunkId": "DISC-2026-02-28-chunk-1",
        "claimId": "CLM-2",
        "confidenceBps": 6758,
        "polarity": "supportive",
        "sourceId": "DISC-2026-02-28",
        "textSnippet": "Issuer disclosure reports redemption operations are normal and orderly. The statement also notes temporary queue expansion during market ...",
        "topic": "redemptions"
      },
      {
        "chunkId": "GOV-2026-02-27-chunk-1",
        "claimId": "CLM-3",
        "confidenceBps": 6080,
        "polarity": "neutral",
        "sourceId": "GOV-2026-02-27",
        "textSnippet": "A governance proposal suggests loosening mint throttles to improve growth and reducing mandatory reserve buffer targets during calm periods.",
        "topic": "reserves"
      }
    ],
    "contradictionMatrix": [
      {
        "explanation": "Queue stress indicates redemptions are not behaving as claimed",
        "id": "C-1",
        "lhs": "Disclosure says redemptions are normal",
        "rhs": "Telemetry redemptionQueueBps=2800",
        "severityBps": 4800
      }
    ]
  },
  "agentBriefs": {
    "prosecutor": {
      "agent": "PROSECUTOR",
      "citations": [
        {
          "chunkId": "ATT-2026-02-28-chunk-1",
          "claimId": "CLM-1",
          "quote": "Independent attestation states reserves are sufficient and fully backed as of Friday close. C...",
          "sourceId": "ATT-2026-02-28"
        }
      ],
      "claims": [
        "Reserve gap penalty=500",
        "Attestation lag penalty=1320",
        "Redemption queue penalty=3000",
        "Contradiction severity total=4800"
      ],
      "confidenceBps": 9100,
      "contradictionsFound": [
        "C-1: Queue stress indicates redemptions are not behaving as claimed (severity=4800)"
      ],
      "policyRecommendation": "REDEMPTION_ONLY",
      "position": "restrict",
      "thesis": "Reserve deterioration, stale attestations, and redemption stress create insolvency propagation risk."
    },
    "defender": {
      "agent": "DEFENDER",
      "citations": [
        {
          "chunkId": "DISC-2026-02-28-chunk-1",
          "claimId": "CLM-2",
          "quote": "Issuer disclosure reports redemption operations are normal and orderly. The statement also no...",
          "sourceId": "DISC-2026-02-28"
        }
      ],
      "claims": [
        "Supportive claims count=1",
        "Evidence freshness score=9221",
        "Admissibility score=8681",
        "Residual market stress (depeg+spread)=6"
      ],
      "confidenceBps": 5714,
      "contradictionsFound": [
        "C-1: Queue stress indicates redemptions are not behaving as claimed (severity=4800)"
      ],
      "policyRecommendation": "REDEMPTION_ONLY",
      "position": "hold",
      "thesis": "Current evidence quality is insufficient to justify maximum restrictions."
    },
    "auditor": {
      "agent": "AUDITOR",
      "citations": [
        {
          "chunkId": "ATT-2026-02-28-chunk-1",
          "claimId": "CLM-1",
          "quote": "Independent attestation states reserves are sufficient and fully backed as of Friday close. C...",
          "sourceId": "ATT-2026-02-28"
        },
        {
          "chunkId": "DISC-2026-02-28-chunk-1",
          "claimId": "CLM-2",
          "quote": "Issuer disclosure reports redemption operations are normal and orderly. The statement also no...",
          "sourceId": "DISC-2026-02-28"
        }
      ],
      "claims": [
        "Contradictions detected=1",
        "Admissibility score=8681",
        "Freshness score=9221",
        "Source failure penalty=0"
      ],
      "confidenceBps": 6278,
      "contradictionsFound": [
        "C-1: Queue stress indicates redemptions are not behaving as claimed (severity=4800)"
      ],
      "policyRecommendation": "NORMAL",
      "position": "restrict",
      "thesis": "Narrative claims conflict with telemetry; admissibility and freshness controls require a safety premium."
    }
  },
  "agentScores": {
    "prosecutorScore": 5813,
    "defenderScore": 1046,
    "auditorScore": 1206,
    "riskScoreBps": 5973
  },
  "policySimulation": {
    "explanation": "THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=6507",
    "modeResults": [
      {
        "falsePositiveCostBps": 3291,
        "mode": "NORMAL",
        "objectiveScoreBps": 6255,
        "operationalReversibilityBps": 9300,
        "rationale": "Minimizes user harm but offers the least solvency protection.",
        "solvencyProtectionBps": 5373,
        "userHarmBps": 1200
      },
      {
        "falsePositiveCostBps": 2605,
        "mode": "THROTTLE",
        "objectiveScoreBps": 6507,
        "operationalReversibilityBps": 7600,
        "rationale": "Balances containment with user access while preserving reversibility.",
        "solvencyProtectionBps": 7573,
        "userHarmBps": 4300
      },
      {
        "falsePositiveCostBps": 3811,
        "mode": "REDEMPTION_ONLY",
        "objectiveScoreBps": 5246,
        "operationalReversibilityBps": 3000,
        "rationale": "Maximizes solvency containment under contradiction-heavy evidence.",
        "solvencyProtectionBps": 8573,
        "userHarmBps": 8200
      }
    ],
    "selectedMode": "THROTTLE"
  },
  "constitutionalAssessments": [
    {
      "principle": "Solvency First",
      "reason": "Selected mode prioritizes solvency containment under observed stress.",
      "status": "SATISFIED"
    },
    {
      "principle": "Orderly Exit",
      "reason": "Selected modes preserve redemptions to support orderly user exits.",
      "status": "SATISFIED"
    },
    {
      "principle": "Minimum Necessary Restriction",
      "reason": "THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=6507",
      "status": "SATISFIED"
    },
    {
      "principle": "Evidence Sufficiency",
      "reason": "admissibilityScoreBps=8681",
      "status": "SATISFIED"
    },
    {
      "principle": "Freshness Requirement",
      "reason": "evidenceFreshnessScoreBps=9221",
      "status": "SATISFIED"
    }
  ],
  "appealOutcome": {
    "confidenceBps": 8597,
    "deltas": {
      "contradictionCountDelta": 1,
      "contradictionSeverityDeltaBps": 4800,
      "freshnessDeltaBps": 9221,
      "riskDeltaBps": -3773
    },
    "outcome": "RELAX",
    "rationale": "New evidence reduced contradiction pressure and/or improved freshness; policy relaxed."
  },
  "evidenceHashes": {
    "evidenceRoot": "0x43c3c853838cbdd7a8074d1d64caf54ee1d4be184754ee5d2d6ba15eee1f60ec",
    "prosecutorEvidenceHash": "0xb4948bfd8206230ce95f434c5d838861e855e6fe288c2a8376236c475bb677fa",
    "defenderEvidenceHash": "0x68fd6ec9c368b4b63c06c7a9df121542b8659f9d07a92b51df1ea4078a2369a6",
    "auditorEvidenceHash": "0x6e52c62cdc2b4554a6beb2a9a58f766ff90798cb5af71799cf52581348a73d49",
    "verdictDigest": "0x88cb439713de367e06b684a25dec3fc44dc586fcdd5de800b7b8394e9d9cf92b"
  },
  "finalVerdict": {
    "mode": 1,
    "modeLabel": "THROTTLE",
    "caseId": "0x4fdaa86b7d5894e58720923e5a0c837445fc9559ca17abfbb2080cd8233c8cac",
    "txHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "reason": "THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=6507"
  },
  "verdictBulletin": {
    "caseId": "0x4fdaa86b7d5894e58720923e5a0c837445fc9559ca17abfbb2080cd8233c8cac",
    "mode": "THROTTLE",
    "riskScoreBps": 5973,
    "evidenceRoot": "0x43c3c853838cbdd7a8074d1d64caf54ee1d4be184754ee5d2d6ba15eee1f60ec",
    "verdictDigest": "0x88cb439713de367e06b684a25dec3fc44dc586fcdd5de800b7b8394e9d9cf92b",
    "policyExplanation": null,
    "constitutionalAssessments": [
      {
        "principle": "Solvency First",
        "reason": "Selected mode prioritizes solvency containment under observed stress.",
        "status": "SATISFIED"
      },
      {
        "principle": "Orderly Exit",
        "reason": "Selected modes preserve redemptions to support orderly user exits.",
        "status": "SATISFIED"
      },
      {
        "principle": "Minimum Necessary Restriction",
        "reason": "THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=6507",
        "status": "SATISFIED"
      },
      {
        "principle": "Evidence Sufficiency",
        "reason": "admissibilityScoreBps=8681",
        "status": "SATISFIED"
      },
      {
        "principle": "Freshness Requirement",
        "reason": "evidenceFreshnessScoreBps=9221",
        "status": "SATISFIED"
      }
    ],
    "appealOutcome": {
      "confidenceBps": 8597,
      "deltas": {
        "contradictionCountDelta": 1,
        "contradictionSeverityDeltaBps": 4800,
        "freshnessDeltaBps": 9221,
        "riskDeltaBps": -3773
      },
      "outcome": "RELAX",
      "rationale": "New evidence reduced contradiction pressure and/or improved freshness; policy relaxed."
    },
    "txHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
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

- Evidence dossier is compiled before tribunal reasoning and hashed as `evidenceRoot`.
- Prosecutor / Defender / Auditor briefs are adversarial, citation-backed, and independently hashed.
- Policy mode is selected via counterfactual simulation across NORMAL / THROTTLE / REDEMPTION_ONLY.
- Receiver enforces protocol consequence by calling `MockRWAVault.setRiskMode(mode)`.
