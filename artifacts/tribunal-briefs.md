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
```

## Evidence Hashes

- prosecutorEvidenceHash: `0xb4948bfd8206230ce95f434c5d838861e855e6fe288c2a8376236c475bb677fa`
- defenderEvidenceHash: `0x68fd6ec9c368b4b63c06c7a9df121542b8659f9d07a92b51df1ea4078a2369a6`
- auditorEvidenceHash: `0x6e52c62cdc2b4554a6beb2a9a58f766ff90798cb5af71799cf52581348a73d49`
