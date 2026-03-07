# Oracle Court Proof Artifact

## Deterministic Proof Block

```json
{
  "proofVersion": "oracle-court-ai-governor-v1",
  "proofMode": "onchain-broadcast",
  "generatedAtIso": "2026-03-07T07:49:41.184Z",
  "txHash": "0x54f807f421a8b7a2170c753562a65e3cd55f902a76ad0643b8118abdc6a6066a",
  "blockNumber": "10401244",
  "chainId": 11155111,
  "receiverAddress": "0x4f89381387bcc29a4f7d12581314d69fad2bb67d",
  "vaultAddress": "0xd5c7fad217fa3b0ba8b03e962723b48aaa153d20",
  "inputValues": {
    "usdcMedian": 1,
    "usdcMin": 0.99995921,
    "usdcMax": 1,
    "usdc24hChangePct": 0.00054633,
    "ethUsd": 1972.271797,
    "btcUsd": 67932.03,
    "reserveCoverageBps": 9900,
    "attestationAgeSeconds": 7200,
    "redemptionQueueBps": 700,
    "depegBps": 0,
    "spreadBps": 0,
    "downside24hBps": 0,
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
    "evidenceRoot": "0xe4fbd64e9b97649611ee455059e3242c4a1a1d03d4eab195b7f74720f0b71d55",
    "generatedAtUnix": 1772869758,
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
    "evidenceRoot": "0xe4fbd64e9b97649611ee455059e3242c4a1a1d03d4eab195b7f74720f0b71d55",
    "generatedAtUnix": 1772869758,
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
    "prosecutor": null,
    "defender": null,
    "auditor": null
  },
  "agentScores": {
    "prosecutorScore": 35,
    "defenderScore": 976,
    "auditorScore": 6500,
    "riskScoreBps": 5559
  },
  "policySimulation": {
    "explanation": "NORMAL selected by counterfactual policy simulation: Minimizes user harm but offers the least solvency protection. objective=6304",
    "modeResults": [
      {
        "falsePositiveCostBps": 3146,
        "mode": "NORMAL",
        "objectiveScoreBps": 6304,
        "operationalReversibilityBps": 9300,
        "rationale": "Minimizes user harm but offers the least solvency protection.",
        "solvencyProtectionBps": 4959,
        "userHarmBps": 1200
      },
      {
        "falsePositiveCostBps": 2688,
        "mode": "THROTTLE",
        "objectiveScoreBps": 6151,
        "operationalReversibilityBps": 7600,
        "rationale": "Balances containment with user access while preserving reversibility.",
        "solvencyProtectionBps": 6359,
        "userHarmBps": 4300
      },
      {
        "falsePositiveCostBps": 3976,
        "mode": "REDEMPTION_ONLY",
        "objectiveScoreBps": 4873,
        "operationalReversibilityBps": 3000,
        "rationale": "Maximizes solvency containment under contradiction-heavy evidence.",
        "solvencyProtectionBps": 7359,
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
    "confidenceBps": 6200,
    "deltas": {
      "contradictionCountDelta": 0,
      "contradictionSeverityDeltaBps": 0,
      "freshnessDeltaBps": 0,
      "riskDeltaBps": 0
    },
    "outcome": "MAINTAIN",
    "rationale": "Evidence deltas did not justify a mode transition; policy maintained."
  },
  "modelGeneration": {
    "summary": {
      "model": "gpt-4.1-mini",
      "promptDigest": "0xfb8fd9ea70d10fa19dc8050948d5b8c3d028de9d4d16408b28b614363a580c2e",
      "provider": "openai-responses",
      "reason": "Schema-validated model-generated findings attached to tribunal briefs through local simulation config fallback (non-confidential).",
      "responseDigest": "0xdc2fd53ad4c029051de46ae9a9880b5bea944025ba150e884eb7e8484b243c0c",
      "status": "APPLIED"
    },
    "briefs": {
      "prosecutor": null,
      "defender": null,
      "auditor": null
    }
  },
  "evidenceHashes": {
    "evidenceRoot": "0xe4fbd64e9b97649611ee455059e3242c4a1a1d03d4eab195b7f74720f0b71d55",
    "prosecutorEvidenceHash": "0xc8b94045e0e47e0774d5b0e0b6a00f52639ca61680db2ac8da50128c455a5b97",
    "defenderEvidenceHash": "0x679d2d4da3abf1a05b5af78ea1df8a081c855f145aa9ae3b259227b5423afe21",
    "auditorEvidenceHash": "0xf8c864888b3d26a7b67c624dc285ecb5779e2134ba5c984c304625330d5df8cb",
    "verdictDigest": "0xb7ff7856c98774958160bc188048b0f693ea216a1cad3bf565aeb99cbcd922d4"
  },
  "finalVerdict": {
    "mode": 0,
    "modeLabel": "NORMAL",
    "policyMode": 0,
    "policyModeLabel": "NORMAL",
    "caseId": "0x97cd9c477f26083e083df80d5d7188490bed2af95ae8a8c26b094df407581cb3",
    "txHash": "0x54f807f421a8b7a2170c753562a65e3cd55f902a76ad0643b8118abdc6a6066a",
    "reason": "NORMAL selected by counterfactual policy simulation: Minimizes user harm but offers the least solvency protection. objective=6304"
  },
  "verdictBulletin": {
    "caseId": "0x97cd9c477f26083e083df80d5d7188490bed2af95ae8a8c26b094df407581cb3",
    "mode": "NORMAL",
    "riskScoreBps": 5559,
    "evidenceRoot": "0xe4fbd64e9b97649611ee455059e3242c4a1a1d03d4eab195b7f74720f0b71d55",
    "verdictDigest": "0xb7ff7856c98774958160bc188048b0f693ea216a1cad3bf565aeb99cbcd922d4",
    "policyExplanation": "NORMAL selected by counterfactual policy simulation: Minimizes user harm but offers the least solvency protection. objective=6304",
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
      "confidenceBps": 6200,
      "deltas": {
        "contradictionCountDelta": 0,
        "contradictionSeverityDeltaBps": 0,
        "freshnessDeltaBps": 0,
        "riskDeltaBps": 0
      },
      "outcome": "MAINTAIN",
      "rationale": "Evidence deltas did not justify a mode transition; policy maintained."
    },
    "modelGeneration": {
      "model": "gpt-4.1-mini",
      "promptDigest": "0xfb8fd9ea70d10fa19dc8050948d5b8c3d028de9d4d16408b28b614363a580c2e",
      "provider": "openai-responses",
      "reason": "Schema-validated model-generated findings attached to tribunal briefs through local simulation config fallback (non-confidential).",
      "responseDigest": "0xdc2fd53ad4c029051de46ae9a9880b5bea944025ba150e884eb7e8484b243c0c",
      "status": "APPLIED"
    },
    "txHash": "0x54f807f421a8b7a2170c753562a65e3cd55f902a76ad0643b8118abdc6a6066a"
  },
  "onchainState": {
    "receiver": {
      "latestMode": 0,
      "latestRiskScoreBps": 5559,
      "latestProsecutorScore": 35,
      "latestDefenderScore": 976,
      "latestAuditorScore": 6500,
      "latestContradictionCount": 0,
      "latestContradictionSeverityBps": 0,
      "latestEvidenceFreshnessScoreBps": 1500,
      "latestAdmissibilityScoreBps": 9095,
      "latestTimestamp": 1772869758,
      "latestCaseId": "0x97cd9c477f26083e083df80d5d7188490bed2af95ae8a8c26b094df407581cb3",
      "latestProsecutorEvidenceHash": "0xc8b94045e0e47e0774d5b0e0b6a00f52639ca61680db2ac8da50128c455a5b97",
      "latestDefenderEvidenceHash": "0x679d2d4da3abf1a05b5af78ea1df8a081c855f145aa9ae3b259227b5423afe21",
      "latestAuditorEvidenceHash": "0xf8c864888b3d26a7b67c624dc285ecb5779e2134ba5c984c304625330d5df8cb",
      "latestVerdictDigest": "0xb7ff7856c98774958160bc188048b0f693ea216a1cad3bf565aeb99cbcd922d4"
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
      "totalMinted": "20000",
      "totalRedeemed": "6000",
      "actorState": {
        "actorAddress": "0x7cF2523342Bc161dc2ac73D4f354251605675d54",
        "balance": "14000"
      }
    }
  }
}
```

## Notes

- Evidence dossier is compiled before tribunal reasoning and hashed as `evidenceRoot`.
- Prosecutor / Defender / Auditor deterministic briefs remain the enforcement source of truth and are independently hashed.
- Optional model findings are schema-validated against live dossier claim IDs and do not change the selected policy mode.
- Policy mode is selected via counterfactual simulation across NORMAL / THROTTLE / REDEMPTION_ONLY.
- Receiver enforces protocol consequence by calling `MockRWAVault.setRiskMode(mode)`.
- If `proofMode=simulated-placeholder`, treat artifact as simulation-only (not final onchain proof).
