# Oracle Court Proof Artifact

## Deterministic Proof Block

```json
{
  "proofVersion": "oracle-court-ai-governor-v1",
  "proofMode": "onchain-broadcast",
  "generatedAtIso": "2026-03-07T00:18:29.922Z",
  "txHash": "0x6dda1f34ccfdd4cd27c94b6ab325292870068d8a206d81eac07dfe85356be44e",
  "blockNumber": "10399301",
  "chainId": 11155111,
  "receiverAddress": "0x4f89381387bcc29a4f7d12581314d69fad2bb67d",
  "vaultAddress": "0xd5c7fad217fa3b0ba8b03e962723b48aaa153d20",
  "inputValues": {
    "usdcMedian": 0.999952,
    "usdcMin": 0.9999,
    "usdcMax": 1.00008897,
    "usdc24hChangePct": -0.00882338,
    "ethUsd": 1981.694932,
    "btcUsd": 68217.612203,
    "reserveCoverageBps": 9900,
    "attestationAgeSeconds": 7200,
    "redemptionQueueBps": 700,
    "depegBps": 0,
    "spreadBps": 2,
    "downside24hBps": 1,
    "reserveCoverageGapBps": 0,
    "attestationLagPenaltyBps": 0,
    "redemptionQueuePenaltyBps": 0,
    "sourceFailurePenaltyBps": 0,
    "macroStressBps": 35
  },
  "evidenceDossierSummary": {
    "admissibilityScoreBps": 9095,
    "claimCount": 3,
    "contradictionCount": 0,
    "evidenceFreshnessScoreBps": 1500,
    "evidenceRoot": "0xef78a6c4bf8d50b44a7616f4425bf23e71f00096afc4a85a1f3c3b2c47bb2421",
    "generatedAtUnix": 1772842686,
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
    "evidenceRoot": "0xef78a6c4bf8d50b44a7616f4425bf23e71f00096afc4a85a1f3c3b2c47bb2421",
    "generatedAtUnix": 1772842686,
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
      "confidenceBps": 5614,
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
      "confidenceBps": 7951,
      "contradictionsFound": [],
      "policyRecommendation": "REDEMPTION_ONLY",
      "position": "hold",
      "thesis": "Evidence coherence is acceptable; no major contradiction penalties detected."
    }
  },
  "agentScores": {
    "prosecutorScore": 40,
    "defenderScore": 976,
    "auditorScore": 6502,
    "riskScoreBps": 5566
  },
  "policySimulation": {
    "explanation": "NORMAL selected by counterfactual policy simulation: Minimizes user harm but offers the least solvency protection. objective=6307",
    "modeResults": [
      {
        "falsePositiveCostBps": 3148,
        "mode": "NORMAL",
        "objectiveScoreBps": 6307,
        "operationalReversibilityBps": 9300,
        "rationale": "Minimizes user harm but offers the least solvency protection.",
        "solvencyProtectionBps": 4966,
        "userHarmBps": 1200
      },
      {
        "falsePositiveCostBps": 2687,
        "mode": "THROTTLE",
        "objectiveScoreBps": 6154,
        "operationalReversibilityBps": 7600,
        "rationale": "Balances containment with user access while preserving reversibility.",
        "solvencyProtectionBps": 6366,
        "userHarmBps": 4300
      },
      {
        "falsePositiveCostBps": 3974,
        "mode": "REDEMPTION_ONLY",
        "objectiveScoreBps": 4877,
        "operationalReversibilityBps": 3000,
        "rationale": "Maximizes solvency containment under contradiction-heavy evidence.",
        "solvencyProtectionBps": 7366,
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
      "riskDeltaBps": -4434
    },
    "outcome": "RELAX",
    "rationale": "New evidence reduced contradiction pressure and/or improved freshness; policy relaxed."
  },
  "evidenceHashes": {
    "evidenceRoot": "0xef78a6c4bf8d50b44a7616f4425bf23e71f00096afc4a85a1f3c3b2c47bb2421",
    "prosecutorEvidenceHash": "0x40fee3fff61b5923fbaa83a2fd2a9620bd5edda484cd847b115eb310b51ada5e",
    "defenderEvidenceHash": "0xe10428e9b19a2e2d620c4d8cd3979d469834ac3741e02c8dbb361776a6a568dd",
    "auditorEvidenceHash": "0x1e813cdb2da59a86502350139ebf9e6b4feaba651bb1a3bc69edf6941a3f53bc",
    "verdictDigest": "0x1e872f21103900c102d30dd08a9cf4c5813e8efd91e64860946eef97f47bae01"
  },
  "finalVerdict": {
    "mode": 0,
    "modeLabel": "NORMAL",
    "policyMode": 0,
    "policyModeLabel": "NORMAL",
    "caseId": "0x41568898e5875dc9e77765ad3dcc847b1fff4fd28d34f44afec5f27d31364896",
    "txHash": "0x6dda1f34ccfdd4cd27c94b6ab325292870068d8a206d81eac07dfe85356be44e",
    "reason": "NORMAL selected by counterfactual policy simulation: Minimizes user harm but offers the least solvency protection. objective=6307"
  },
  "verdictBulletin": {
    "caseId": "0x41568898e5875dc9e77765ad3dcc847b1fff4fd28d34f44afec5f27d31364896",
    "mode": "NORMAL",
    "riskScoreBps": 5566,
    "evidenceRoot": "0xef78a6c4bf8d50b44a7616f4425bf23e71f00096afc4a85a1f3c3b2c47bb2421",
    "verdictDigest": "0x1e872f21103900c102d30dd08a9cf4c5813e8efd91e64860946eef97f47bae01",
    "policyExplanation": "NORMAL selected by counterfactual policy simulation: Minimizes user harm but offers the least solvency protection. objective=6307",
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
        "riskDeltaBps": -4434
      },
      "outcome": "RELAX",
      "rationale": "New evidence reduced contradiction pressure and/or improved freshness; policy relaxed."
    },
    "txHash": "0x6dda1f34ccfdd4cd27c94b6ab325292870068d8a206d81eac07dfe85356be44e"
  },
  "onchainState": {
    "receiver": {
      "latestMode": 0,
      "latestRiskScoreBps": 5566,
      "latestProsecutorScore": 40,
      "latestDefenderScore": 976,
      "latestAuditorScore": 6502,
      "latestContradictionCount": 0,
      "latestContradictionSeverityBps": 0,
      "latestEvidenceFreshnessScoreBps": 1500,
      "latestAdmissibilityScoreBps": 9095,
      "latestTimestamp": 1772842686,
      "latestCaseId": "0x41568898e5875dc9e77765ad3dcc847b1fff4fd28d34f44afec5f27d31364896",
      "latestProsecutorEvidenceHash": "0x40fee3fff61b5923fbaa83a2fd2a9620bd5edda484cd847b115eb310b51ada5e",
      "latestDefenderEvidenceHash": "0xe10428e9b19a2e2d620c4d8cd3979d469834ac3741e02c8dbb361776a6a568dd",
      "latestAuditorEvidenceHash": "0x1e813cdb2da59a86502350139ebf9e6b4feaba651bb1a3bc69edf6941a3f53bc",
      "latestVerdictDigest": "0x1e872f21103900c102d30dd08a9cf4c5813e8efd91e64860946eef97f47bae01"
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
      "totalMinted": "15000",
      "totalRedeemed": "5000",
      "actorState": {
        "actorAddress": "0x7cF2523342Bc161dc2ac73D4f354251605675d54",
        "balance": "10000"
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
