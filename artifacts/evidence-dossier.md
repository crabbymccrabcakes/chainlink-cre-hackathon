# Evidence Dossier

## Canonical Evidence Root

- evidenceRoot: `0x9181fae4b7dbb99dca8b75f560051e9c7a3508529a300317e3d9844f54078b14`
- admissibilityScoreBps: `8680`
- evidenceFreshnessScoreBps: `9207`
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
