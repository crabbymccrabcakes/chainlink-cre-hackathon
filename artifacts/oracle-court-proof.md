# Oracle Court Proof Artifact

## Deterministic Proof Block

```json
{
  "proofVersion": "oracle-court-ai-governor-v1",
  "proofMode": "onchain-broadcast",
  "generatedAtIso": "2026-03-06T09:02:39.889Z",
  "txHash": "0xce0682cc84d0460812126e3cf8f4c80836c79f7112da592fe5c2afb99f0c637a",
  "blockNumber": "10395283",
  "chainId": 11155111,
  "receiverAddress": "0x4f89381387bcc29a4f7d12581314d69fad2bb67d",
  "vaultAddress": "0xd5c7fad217fa3b0ba8b03e962723b48aaa153d20",
  "inputValues": null,
  "evidenceDossierSummary": {
    "admissibilityScoreBps": 8311,
    "claimCount": 3,
    "contradictionCount": 1,
    "evidenceFreshnessScoreBps": 1817,
    "evidenceRoot": "0x5027f9918437199b3327f99f047ec6d56de34843385dbfbbdd27b6c12bb3e3c2",
    "generatedAtUnix": 1772787753,
    "protectedSourcesPresent": true,
    "sourceIds": [
      "ATT-2026-02-28",
      "DISC-2026-02-28",
      "GOV-2026-02-27"
    ]
  },
  "evidenceDossier": {
    "admissibilityScoreBps": 8311,
    "claimCount": 3,
    "contradictionCount": 1,
    "evidenceFreshnessScoreBps": 1817,
    "evidenceRoot": "0x5027f9918437199b3327f99f047ec6d56de34843385dbfbbdd27b6c12bb3e3c2",
    "generatedAtUnix": 1772787753,
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
        "Evidence freshness score=1817",
        "Admissibility score=8311",
        "Residual market stress (depeg+spread)=2"
      ],
      "confidenceBps": 5574,
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
        "Admissibility score=8311",
        "Freshness score=1817",
        "Source failure penalty=0"
      ],
      "confidenceBps": 8542,
      "contradictionsFound": [
        "C-1: Queue stress indicates redemptions are not behaving as claimed (severity=4800)"
      ],
      "policyRecommendation": "REDEMPTION_ONLY",
      "position": "restrict",
      "thesis": "Narrative claims conflict with telemetry; admissibility and freshness controls require a safety premium."
    }
  },
  "agentScores": {
    "prosecutorScore": 5806,
    "defenderScore": 856,
    "auditorScore": 7384,
    "riskScoreBps": 10000
  },
  "policySimulation": {
    "explanation": "THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=7485",
    "modeResults": [
      {
        "falsePositiveCostBps": 4700,
        "mode": "NORMAL",
        "objectiveScoreBps": 7420,
        "operationalReversibilityBps": 9300,
        "rationale": "Minimizes user harm but offers the least solvency protection.",
        "solvencyProtectionBps": 9000,
        "userHarmBps": 1200
      },
      {
        "falsePositiveCostBps": 1800,
        "mode": "THROTTLE",
        "objectiveScoreBps": 7485,
        "operationalReversibilityBps": 7600,
        "rationale": "Balances containment with user access while preserving reversibility.",
        "solvencyProtectionBps": 9800,
        "userHarmBps": 4300
      },
      {
        "falsePositiveCostBps": 2200,
        "mode": "REDEMPTION_ONLY",
        "objectiveScoreBps": 6025,
        "operationalReversibilityBps": 3000,
        "rationale": "Maximizes solvency containment under contradiction-heavy evidence.",
        "solvencyProtectionBps": 10000,
        "userHarmBps": 8200
      }
    ],
    "selectedMode": "THROTTLE"
  },
  "constitutionalAssessments": [
    {
      "principle": "Solvency First",
      "reason": "Constitutional gate downgraded THROTTLE to NORMAL because admissibilityScoreBps=8311 and evidenceFreshnessScoreBps=1817 did not clear restrictive-mode thresholds.",
      "status": "BREACHED"
    },
    {
      "principle": "Orderly Exit",
      "reason": "Effective modes preserve redemptions to support orderly user exits.",
      "status": "SATISFIED"
    },
    {
      "principle": "Minimum Necessary Restriction",
      "reason": "Constitutional gate downgraded THROTTLE to NORMAL because admissibilityScoreBps=8311 and evidenceFreshnessScoreBps=1817 did not clear restrictive-mode thresholds.",
      "status": "SATISFIED"
    },
    {
      "principle": "Evidence Sufficiency",
      "reason": "admissibilityScoreBps=8311",
      "status": "SATISFIED"
    },
    {
      "principle": "Freshness Requirement",
      "reason": "evidenceFreshnessScoreBps=1817",
      "status": "BREACHED"
    }
  ],
  "appealOutcome": {
    "confidenceBps": 7877,
    "deltas": {
      "contradictionCountDelta": 1,
      "contradictionSeverityDeltaBps": 4800,
      "freshnessDeltaBps": -2,
      "riskDeltaBps": 4787
    },
    "outcome": "MAINTAIN",
    "rationale": "Evidence deltas did not justify a mode transition; policy maintained."
  },
  "evidenceHashes": {
    "evidenceRoot": "0x5027f9918437199b3327f99f047ec6d56de34843385dbfbbdd27b6c12bb3e3c2",
    "prosecutorEvidenceHash": "0xb4948bfd8206230ce95f434c5d838861e855e6fe288c2a8376236c475bb677fa",
    "defenderEvidenceHash": "0x40627cf2e159fa0252fb84ca3686bfe40d0d23a7bd546e15a659c9c7f581822b",
    "auditorEvidenceHash": "0x47a635b2e21fd427750711ae0b9149ce4c15d299b8fbf54ee9a0d5851e97f8ee",
    "verdictDigest": "0x33e883ede007b5362073c32e0225b7048dffce4e31776ec7fe24a74e5d232f28"
  },
  "finalVerdict": {
    "mode": 0,
    "modeLabel": "NORMAL",
    "policyMode": 1,
    "policyModeLabel": "THROTTLE",
    "caseId": "0x99777aefdeade5c1a6b59a3d637c334de4c090733fdfd1aff1833e9c78a63566",
    "txHash": "0xce0682cc84d0460812126e3cf8f4c80836c79f7112da592fe5c2afb99f0c637a",
    "reason": "THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=7485"
  },
  "verdictBulletin": {
    "caseId": "0x99777aefdeade5c1a6b59a3d637c334de4c090733fdfd1aff1833e9c78a63566",
    "mode": "NORMAL",
    "riskScoreBps": 10000,
    "evidenceRoot": "0x5027f9918437199b3327f99f047ec6d56de34843385dbfbbdd27b6c12bb3e3c2",
    "verdictDigest": "0x33e883ede007b5362073c32e0225b7048dffce4e31776ec7fe24a74e5d232f28",
    "policyExplanation": null,
    "constitutionalAssessments": [
      {
        "principle": "Solvency First",
        "reason": "Constitutional gate downgraded THROTTLE to NORMAL because admissibilityScoreBps=8311 and evidenceFreshnessScoreBps=1817 did not clear restrictive-mode thresholds.",
        "status": "BREACHED"
      },
      {
        "principle": "Orderly Exit",
        "reason": "Effective modes preserve redemptions to support orderly user exits.",
        "status": "SATISFIED"
      },
      {
        "principle": "Minimum Necessary Restriction",
        "reason": "Constitutional gate downgraded THROTTLE to NORMAL because admissibilityScoreBps=8311 and evidenceFreshnessScoreBps=1817 did not clear restrictive-mode thresholds.",
        "status": "SATISFIED"
      },
      {
        "principle": "Evidence Sufficiency",
        "reason": "admissibilityScoreBps=8311",
        "status": "SATISFIED"
      },
      {
        "principle": "Freshness Requirement",
        "reason": "evidenceFreshnessScoreBps=1817",
        "status": "BREACHED"
      }
    ],
    "appealOutcome": {
      "confidenceBps": 7877,
      "deltas": {
        "contradictionCountDelta": 1,
        "contradictionSeverityDeltaBps": 4800,
        "freshnessDeltaBps": -2,
        "riskDeltaBps": 4787
      },
      "outcome": "MAINTAIN",
      "rationale": "Evidence deltas did not justify a mode transition; policy maintained."
    },
    "txHash": "0xce0682cc84d0460812126e3cf8f4c80836c79f7112da592fe5c2afb99f0c637a"
  },
  "onchainState": {
    "receiver": {
      "latestMode": 0,
      "latestRiskScoreBps": 10000,
      "latestProsecutorScore": 5806,
      "latestDefenderScore": 856,
      "latestAuditorScore": 7384,
      "latestContradictionCount": 1,
      "latestContradictionSeverityBps": 4800,
      "latestEvidenceFreshnessScoreBps": 1817,
      "latestAdmissibilityScoreBps": 8311,
      "latestTimestamp": 1772787753,
      "latestCaseId": "0x99777aefdeade5c1a6b59a3d637c334de4c090733fdfd1aff1833e9c78a63566",
      "latestProsecutorEvidenceHash": "0xb4948bfd8206230ce95f434c5d838861e855e6fe288c2a8376236c475bb677fa",
      "latestDefenderEvidenceHash": "0x40627cf2e159fa0252fb84ca3686bfe40d0d23a7bd546e15a659c9c7f581822b",
      "latestAuditorEvidenceHash": "0x47a635b2e21fd427750711ae0b9149ce4c15d299b8fbf54ee9a0d5851e97f8ee",
      "latestVerdictDigest": "0x33e883ede007b5362073c32e0225b7048dffce4e31776ec7fe24a74e5d232f28"
    },
    "vault": {
      "riskMode": 0,
      "throttleMintLimit": "1000",
      "reserveCoverageBps": 9400,
      "attestationAgeSeconds": 172800,
      "redemptionQueueBps": 2800,
      "canMint1000": true,
      "canMint5000": true,
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
- If `proofMode=simulated-placeholder`, treat artifact as simulation-only (not final onchain proof).
