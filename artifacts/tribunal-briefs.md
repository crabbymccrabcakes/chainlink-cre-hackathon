> Scenario: appeal-canonical (tx: 0x6dda1f34ccfdd4cd27c94b6ab325292870068d8a206d81eac07dfe85356be44e)

# Tribunal Briefs

## Prosecutor

```json
{
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
}
```

## Defender

```json
{
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
}
```

## Auditor

```json
{
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
```

## Evidence Hashes

- prosecutorEvidenceHash: `0x40fee3fff61b5923fbaa83a2fd2a9620bd5edda484cd847b115eb310b51ada5e`
- defenderEvidenceHash: `0xe10428e9b19a2e2d620c4d8cd3979d469834ac3741e02c8dbb361776a6a568dd`
- auditorEvidenceHash: `0x1e813cdb2da59a86502350139ebf9e6b4feaba651bb1a3bc69edf6941a3f53bc`
