# Evidence Dossier

## Canonical Evidence Root

- evidenceRoot: `0x43c3c853838cbdd7a8074d1d64caf54ee1d4be184754ee5d2d6ba15eee1f60ec`
- admissibilityScoreBps: `8681`
- evidenceFreshnessScoreBps: `9221`
- protectedSourcesPresent: `true`

## Claims

```json
[
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
]
```

## Contradiction Matrix

```json
[
  {
    "explanation": "Queue stress indicates redemptions are not behaving as claimed",
    "id": "C-1",
    "lhs": "Disclosure says redemptions are normal",
    "rhs": "Telemetry redemptionQueueBps=2800",
    "severityBps": 4800
  }
]
```
