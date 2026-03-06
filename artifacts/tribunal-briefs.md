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
```

## Evidence Hashes

- prosecutorEvidenceHash: `0xb4948bfd8206230ce95f434c5d838861e855e6fe288c2a8376236c475bb677fa`
- defenderEvidenceHash: `0x40627cf2e159fa0252fb84ca3686bfe40d0d23a7bd546e15a659c9c7f581822b`
- auditorEvidenceHash: `0x47a635b2e21fd427750711ae0b9149ce4c15d299b8fbf54ee9a0d5851e97f8ee`
