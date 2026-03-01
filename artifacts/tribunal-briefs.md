> Scenario: stressed-canonical (tx: 0x116b46285fec8335894c1359556917187a202faffb2379094073ecc22aced23b)

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
```

## Evidence Hashes

- prosecutorEvidenceHash: `0xb4948bfd8206230ce95f434c5d838861e855e6fe288c2a8376236c475bb677fa`
- defenderEvidenceHash: `0x900cc1587bf1009836831a32d3eab9371fa3afbe19a46df8cb06f3932118bf5d`
- auditorEvidenceHash: `0xf2c9b58868cb727d5a7a68c474eededcee5ae70046c999690497ae4d99a6394a`
