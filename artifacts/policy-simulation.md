# Policy Simulation

## Counterfactual Mode Analysis

```json
{
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
}
```

## Final Selection

- selectedMode: `NORMAL`
- rationale: NORMAL selected by counterfactual policy simulation: Minimizes user harm but offers the least solvency protection. objective=6304
