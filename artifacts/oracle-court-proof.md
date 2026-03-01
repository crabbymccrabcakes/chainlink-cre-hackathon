# Oracle Court Proof Artifact

> Scenario: stressed-canonical (tx: 0x116b46285fec8335894c1359556917187a202faffb2379094073ecc22aced23b)

## Deterministic Proof Block

```json
{
  "proofVersion": "oracle-court-ai-governor-v1",
  "generatedAtIso": "2026-03-01T05:53:28.515Z",
  "txHash": "0x116b46285fec8335894c1359556917187a202faffb2379094073ecc22aced23b",
  "blockNumber": "10359612",
  "chainId": 11155111,
  "receiverAddress": "0x874209ec5beaf34c6b570adc7f8f6ea4b01464f9",
  "vaultAddress": "0xd730a0f5ef8e419b1dbf3101e019dce9e2c040de",
  "inputValues": null,
  "evidenceDossierSummary": {
    "admissibilityScoreBps": 8680,
    "claimCount": 3,
    "contradictionCount": 1,
    "evidenceFreshnessScoreBps": 9207,
    "evidenceRoot": "0x9181fae4b7dbb99dca8b75f560051e9c7a3508529a300317e3d9844f54078b14",
    "generatedAtUnix": 1772344394,
    "protectedSourcesPresent": true,
    "sourceIds": [
      "ATT-2026-02-28",
      "DISC-2026-02-28",
      "GOV-2026-02-27"
    ]
  },
  "evidenceDossier": {
    "admissibilityScoreBps": 8680,
    "claimCount": 3,
    "contradictionCount": 1,
    "evidenceFreshnessScoreBps": 9207,
    "evidenceRoot": "0x9181fae4b7dbb99dca8b75f560051e9c7a3508529a300317e3d9844f54078b14",
    "generatedAtUnix": 1772344394,
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
        "Evidence freshness score=9207",
        "Admissibility score=8680",
        "Residual market stress (depeg+spread)=5"
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
        "Admissibility score=8680",
        "Freshness score=9207",
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
    "prosecutorScore": 5810,
    "defenderScore": 1046,
    "auditorScore": 1205,
    "riskScoreBps": 5969
  },
  "policySimulation": {
    "explanation": "THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=6505",
    "modeResults": [
      {
        "falsePositiveCostBps": 3289,
        "mode": "NORMAL",
        "objectiveScoreBps": 6253,
        "operationalReversibilityBps": 9300,
        "rationale": "Minimizes user harm but offers the least solvency protection.",
        "solvencyProtectionBps": 5369,
        "userHarmBps": 1200
      },
      {
        "falsePositiveCostBps": 2606,
        "mode": "THROTTLE",
        "objectiveScoreBps": 6505,
        "operationalReversibilityBps": 7600,
        "rationale": "Balances containment with user access while preserving reversibility.",
        "solvencyProtectionBps": 7569,
        "userHarmBps": 4300
      },
      {
        "falsePositiveCostBps": 3812,
        "mode": "REDEMPTION_ONLY",
        "objectiveScoreBps": 5244,
        "operationalReversibilityBps": 3000,
        "rationale": "Maximizes solvency containment under contradiction-heavy evidence.",
        "solvencyProtectionBps": 8569,
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
      "reason": "THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=6505",
      "status": "SATISFIED"
    },
    {
      "principle": "Evidence Sufficiency",
      "reason": "admissibilityScoreBps=8680",
      "status": "SATISFIED"
    },
    {
      "principle": "Freshness Requirement",
      "reason": "evidenceFreshnessScoreBps=9207",
      "status": "SATISFIED"
    }
  ],
  "appealOutcome": {
    "confidenceBps": 9035,
    "deltas": {
      "contradictionCountDelta": 1,
      "contradictionSeverityDeltaBps": 4800,
      "freshnessDeltaBps": 9207,
      "riskDeltaBps": 5969
    },
    "outcome": "ESCALATE",
    "rationale": "New evidence increased contradiction pressure or risk score; policy escalated."
  },
  "evidenceHashes": {
    "evidenceRoot": "0x9181fae4b7dbb99dca8b75f560051e9c7a3508529a300317e3d9844f54078b14",
    "prosecutorEvidenceHash": "0xb4948bfd8206230ce95f434c5d838861e855e6fe288c2a8376236c475bb677fa",
    "defenderEvidenceHash": "0x900cc1587bf1009836831a32d3eab9371fa3afbe19a46df8cb06f3932118bf5d",
    "auditorEvidenceHash": "0xf2c9b58868cb727d5a7a68c474eededcee5ae70046c999690497ae4d99a6394a",
    "verdictDigest": "0x2ec089dae8f0a84c6944f7c1d4558beb4dcb33dd384c861fbaaff4eef54b726b"
  },
  "finalVerdict": {
    "mode": 1,
    "modeLabel": "THROTTLE",
    "caseId": "0xdae2b2af11aa58e3e81e9ffd0484a137efdeaf6bef38f2ce078e1e8d749ec4a2",
    "txHash": "0x116b46285fec8335894c1359556917187a202faffb2379094073ecc22aced23b",
    "reason": "THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=6505"
  },
  "verdictBulletin": {
    "caseId": "0xdae2b2af11aa58e3e81e9ffd0484a137efdeaf6bef38f2ce078e1e8d749ec4a2",
    "mode": "THROTTLE",
    "riskScoreBps": 5969,
    "evidenceRoot": "0x9181fae4b7dbb99dca8b75f560051e9c7a3508529a300317e3d9844f54078b14",
    "verdictDigest": "0x2ec089dae8f0a84c6944f7c1d4558beb4dcb33dd384c861fbaaff4eef54b726b",
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
        "reason": "THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=6505",
        "status": "SATISFIED"
      },
      {
        "principle": "Evidence Sufficiency",
        "reason": "admissibilityScoreBps=8680",
        "status": "SATISFIED"
      },
      {
        "principle": "Freshness Requirement",
        "reason": "evidenceFreshnessScoreBps=9207",
        "status": "SATISFIED"
      }
    ],
    "appealOutcome": {
      "confidenceBps": 9035,
      "deltas": {
        "contradictionCountDelta": 1,
        "contradictionSeverityDeltaBps": 4800,
        "freshnessDeltaBps": 9207,
        "riskDeltaBps": 5969
      },
      "outcome": "ESCALATE",
      "rationale": "New evidence increased contradiction pressure or risk score; policy escalated."
    },
    "txHash": "0x116b46285fec8335894c1359556917187a202faffb2379094073ecc22aced23b"
  },
  "onchainState": {
    "receiver": {
      "latestMode": 1,
      "latestRiskScoreBps": 5969,
      "latestProsecutorScore": 5810,
      "latestDefenderScore": 1046,
      "latestAuditorScore": 1205,
      "latestTimestamp": 1772344394,
      "latestCaseId": "0xdae2b2af11aa58e3e81e9ffd0484a137efdeaf6bef38f2ce078e1e8d749ec4a2",
      "latestProsecutorEvidenceHash": "0xb4948bfd8206230ce95f434c5d838861e855e6fe288c2a8376236c475bb677fa",
      "latestDefenderEvidenceHash": "0x900cc1587bf1009836831a32d3eab9371fa3afbe19a46df8cb06f3932118bf5d",
      "latestAuditorEvidenceHash": "0xf2c9b58868cb727d5a7a68c474eededcee5ae70046c999690497ae4d99a6394a",
      "latestVerdictDigest": "0x2ec089dae8f0a84c6944f7c1d4558beb4dcb33dd384c861fbaaff4eef54b726b"
    },
    "vault": {
      "riskMode": 1,
      "throttleMintLimit": "1000",
      "reserveCoverageBps": 9400,
      "attestationAgeSeconds": 172800,
      "redemptionQueueBps": 2800,
      "canMint1000": true,
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
