# Oracle Court Proof Artifact

## Deterministic Proof Block

```json
{
  "proofVersion": "oracle-court-ai-governor-v1",
  "proofMode": "onchain-broadcast",
  "generatedAtIso": "2026-03-06T23:01:29.287Z",
  "txHash": "0x4128f84408bb25e7589a1346f1db07eaf825d478500265851a61ef10ef5c3d0d",
  "blockNumber": "10398969",
  "chainId": 11155111,
  "receiverAddress": "0x4f89381387bcc29a4f7d12581314d69fad2bb67d",
  "vaultAddress": "0xd5c7fad217fa3b0ba8b03e962723b48aaa153d20",
  "inputValues": null,
  "evidenceDossierSummary": {
    "admissibilityScoreBps": 9095,
    "claimCount": 3,
    "contradictionCount": 0,
    "evidenceFreshnessScoreBps": 1500,
    "evidenceRoot": "0xb57eb3c9e725d01ce00c1e3b91f621b263dca0caecd91d7e532ba761b70e3af3",
    "generatedAtUnix": 1772838077,
    "protectedSourcesPresent": true,
    "sourceIds": [
      "ATT-2026-02-28",
      "DISC-2026-02-28",
      "GOV-2026-02-27"
    ]
  },
  "evidenceDossier": {
    "admissibilityScoreBps": 9095,
    "claimCount": 3,
    "contradictionCount": 0,
    "evidenceFreshnessScoreBps": 1500,
    "evidenceRoot": "0xb57eb3c9e725d01ce00c1e3b91f621b263dca0caecd91d7e532ba761b70e3af3",
    "generatedAtUnix": 1772838077,
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
    "contradictionMatrix": []
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
        "Reserve gap penalty=0",
        "Attestation lag penalty=0",
        "Redemption queue penalty=0",
        "Contradiction severity total=0"
      ],
      "confidenceBps": 5615,
      "contradictionsFound": [],
      "policyRecommendation": "NORMAL",
      "position": "restrict",
      "thesis": "Stress indicators are present and justify a precautionary restriction posture."
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
        "Evidence freshness score=1500",
        "Admissibility score=9095",
        "Residual market stress (depeg+spread)=2"
      ],
      "confidenceBps": 6610,
      "contradictionsFound": [],
      "policyRecommendation": "NORMAL",
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
        "Contradictions detected=0",
        "Admissibility score=9095",
        "Freshness score=1500",
        "Source failure penalty=0"
      ],
      "confidenceBps": 7950,
      "contradictionsFound": [],
      "policyRecommendation": "REDEMPTION_ONLY",
      "position": "hold",
      "thesis": "Evidence coherence is acceptable; no major contradiction penalties detected."
    }
  },
  "agentScores": {
    "prosecutorScore": 42,
    "defenderScore": 976,
    "auditorScore": 6501,
    "riskScoreBps": 5567
  },
  "policySimulation": {
    "explanation": "NORMAL selected by counterfactual policy simulation: Minimizes user harm but offers the least solvency protection. objective=6308",
    "modeResults": [
      {
        "falsePositiveCostBps": 3148,
        "mode": "NORMAL",
        "objectiveScoreBps": 6308,
        "operationalReversibilityBps": 9300,
        "rationale": "Minimizes user harm but offers the least solvency protection.",
        "solvencyProtectionBps": 4967,
        "userHarmBps": 1200
      },
      {
        "falsePositiveCostBps": 2687,
        "mode": "THROTTLE",
        "objectiveScoreBps": 6155,
        "operationalReversibilityBps": 7600,
        "rationale": "Balances containment with user access while preserving reversibility.",
        "solvencyProtectionBps": 6367,
        "userHarmBps": 4300
      },
      {
        "falsePositiveCostBps": 3973,
        "mode": "REDEMPTION_ONLY",
        "objectiveScoreBps": 4878,
        "operationalReversibilityBps": 3000,
        "rationale": "Maximizes solvency containment under contradiction-heavy evidence.",
        "solvencyProtectionBps": 7367,
        "userHarmBps": 8200
      }
    ],
    "selectedMode": "NORMAL"
  },
  "constitutionalAssessments": [
    {
      "principle": "Solvency First",
      "reason": "Risk is low enough that solvency-first restrictions were not required.",
      "status": "BREACHED"
    },
    {
      "principle": "Orderly Exit",
      "reason": "Effective modes preserve redemptions to support orderly user exits.",
      "status": "SATISFIED"
    },
    {
      "principle": "Minimum Necessary Restriction",
      "reason": "Minimizes user harm but offers the least solvency protection.",
      "status": "SATISFIED"
    },
    {
      "principle": "Evidence Sufficiency",
      "reason": "admissibilityScoreBps=9095",
      "status": "SATISFIED"
    },
    {
      "principle": "Freshness Requirement",
      "reason": "evidenceFreshnessScoreBps=1500",
      "status": "BREACHED"
    }
  ],
  "appealOutcome": {
    "confidenceBps": 7807,
    "deltas": {
      "contradictionCountDelta": -1,
      "contradictionSeverityDeltaBps": -4800,
      "freshnessDeltaBps": 0,
      "riskDeltaBps": -4433
    },
    "outcome": "RELAX",
    "rationale": "New evidence reduced contradiction pressure and/or improved freshness; policy relaxed."
  },
  "evidenceHashes": {
    "evidenceRoot": "0xb57eb3c9e725d01ce00c1e3b91f621b263dca0caecd91d7e532ba761b70e3af3",
    "prosecutorEvidenceHash": "0x515bf202d386b069685f154230c4c9d89615cca4d8f9b8ae8cef0d7b4c7afd41",
    "defenderEvidenceHash": "0xe10428e9b19a2e2d620c4d8cd3979d469834ac3741e02c8dbb361776a6a568dd",
    "auditorEvidenceHash": "0x6e253fc1af56667c28acfe8f1845a46e69bcf97ea9ed041bc820ddc177378eef",
    "verdictDigest": "0x35ad0eae096cb9ef9d1abc5f1a7bb4fea1f251426befba284eee378e3473f1d7"
  },
  "finalVerdict": {
    "mode": 0,
    "modeLabel": "NORMAL",
    "policyMode": 0,
    "policyModeLabel": "NORMAL",
    "caseId": "0x0be49818d3346f3c5d4d08fac0e482a4987aa15922e1fd516a95e9684087f844",
    "txHash": "0x4128f84408bb25e7589a1346f1db07eaf825d478500265851a61ef10ef5c3d0d",
    "reason": "NORMAL selected by counterfactual policy simulation: Minimizes user harm but offers the least solvency protection. objective=6308"
  },
  "verdictBulletin": {
    "caseId": "0x0be49818d3346f3c5d4d08fac0e482a4987aa15922e1fd516a95e9684087f844",
    "mode": "NORMAL",
    "riskScoreBps": 5567,
    "evidenceRoot": "0xb57eb3c9e725d01ce00c1e3b91f621b263dca0caecd91d7e532ba761b70e3af3",
    "verdictDigest": "0x35ad0eae096cb9ef9d1abc5f1a7bb4fea1f251426befba284eee378e3473f1d7",
    "policyExplanation": null,
    "constitutionalAssessments": [
      {
        "principle": "Solvency First",
        "reason": "Risk is low enough that solvency-first restrictions were not required.",
        "status": "BREACHED"
      },
      {
        "principle": "Orderly Exit",
        "reason": "Effective modes preserve redemptions to support orderly user exits.",
        "status": "SATISFIED"
      },
      {
        "principle": "Minimum Necessary Restriction",
        "reason": "Minimizes user harm but offers the least solvency protection.",
        "status": "SATISFIED"
      },
      {
        "principle": "Evidence Sufficiency",
        "reason": "admissibilityScoreBps=9095",
        "status": "SATISFIED"
      },
      {
        "principle": "Freshness Requirement",
        "reason": "evidenceFreshnessScoreBps=1500",
        "status": "BREACHED"
      }
    ],
    "appealOutcome": {
      "confidenceBps": 7807,
      "deltas": {
        "contradictionCountDelta": -1,
        "contradictionSeverityDeltaBps": -4800,
        "freshnessDeltaBps": 0,
        "riskDeltaBps": -4433
      },
      "outcome": "RELAX",
      "rationale": "New evidence reduced contradiction pressure and/or improved freshness; policy relaxed."
    },
    "txHash": "0x4128f84408bb25e7589a1346f1db07eaf825d478500265851a61ef10ef5c3d0d"
  },
  "onchainState": {
    "receiver": {
      "latestMode": 0,
      "latestRiskScoreBps": 5567,
      "latestProsecutorScore": 42,
      "latestDefenderScore": 976,
      "latestAuditorScore": 6501,
      "latestContradictionCount": 0,
      "latestContradictionSeverityBps": 0,
      "latestEvidenceFreshnessScoreBps": 1500,
      "latestAdmissibilityScoreBps": 9095,
      "latestTimestamp": 1772838077,
      "latestCaseId": "0x0be49818d3346f3c5d4d08fac0e482a4987aa15922e1fd516a95e9684087f844",
      "latestProsecutorEvidenceHash": "0x515bf202d386b069685f154230c4c9d89615cca4d8f9b8ae8cef0d7b4c7afd41",
      "latestDefenderEvidenceHash": "0xe10428e9b19a2e2d620c4d8cd3979d469834ac3741e02c8dbb361776a6a568dd",
      "latestAuditorEvidenceHash": "0x6e253fc1af56667c28acfe8f1845a46e69bcf97ea9ed041bc820ddc177378eef",
      "latestVerdictDigest": "0x35ad0eae096cb9ef9d1abc5f1a7bb4fea1f251426befba284eee378e3473f1d7"
    },
    "vault": {
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
  }
}
```

## Notes

- Evidence dossier is compiled before tribunal reasoning and hashed as `evidenceRoot`.
- Prosecutor / Defender / Auditor briefs are adversarial, citation-backed, and independently hashed.
- Policy mode is selected via counterfactual simulation across NORMAL / THROTTLE / REDEMPTION_ONLY.
- Receiver enforces protocol consequence by calling `MockRWAVault.setRiskMode(mode)`.
- If `proofMode=simulated-placeholder`, treat artifact as simulation-only (not final onchain proof).
