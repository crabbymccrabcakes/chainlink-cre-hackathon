> Scenario: appeal-canonical (tx: 0x6dda1f34ccfdd4cd27c94b6ab325292870068d8a206d81eac07dfe85356be44e)

# Policy Simulation

## Counterfactual Mode Analysis

```json
{
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
}
```

## Final Selection

- selectedMode: `NORMAL`
- rationale: NORMAL selected by counterfactual policy simulation: Minimizes user harm but offers the least solvency protection. objective=6307
