> Scenario: appeal-canonical (tx: 0x4128f84408bb25e7589a1346f1db07eaf825d478500265851a61ef10ef5c3d0d)

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
  "confidenceBps": 5615,
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
  "confidenceBps": 7950,
  "contradictionsFound": [],
  "policyRecommendation": "REDEMPTION_ONLY",
  "position": "hold",
  "thesis": "Evidence coherence is acceptable; no major contradiction penalties detected."
}
```

## Evidence Hashes

- prosecutorEvidenceHash: `0x515bf202d386b069685f154230c4c9d89615cca4d8f9b8ae8cef0d7b4c7afd41`
- defenderEvidenceHash: `0xe10428e9b19a2e2d620c4d8cd3979d469834ac3741e02c8dbb361776a6a568dd`
- auditorEvidenceHash: `0x6e253fc1af56667c28acfe8f1845a46e69bcf97ea9ed041bc820ddc177378eef`
