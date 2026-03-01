# Policy Simulation

## Counterfactual Mode Analysis

```json
{
  "explanation": "THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=6507",
  "modeResults": [
    {
      "falsePositiveCostBps": 3291,
      "mode": "NORMAL",
      "objectiveScoreBps": 6255,
      "operationalReversibilityBps": 9300,
      "rationale": "Minimizes user harm but offers the least solvency protection.",
      "solvencyProtectionBps": 5373,
      "userHarmBps": 1200
    },
    {
      "falsePositiveCostBps": 2605,
      "mode": "THROTTLE",
      "objectiveScoreBps": 6507,
      "operationalReversibilityBps": 7600,
      "rationale": "Balances containment with user access while preserving reversibility.",
      "solvencyProtectionBps": 7573,
      "userHarmBps": 4300
    },
    {
      "falsePositiveCostBps": 3811,
      "mode": "REDEMPTION_ONLY",
      "objectiveScoreBps": 5246,
      "operationalReversibilityBps": 3000,
      "rationale": "Maximizes solvency containment under contradiction-heavy evidence.",
      "solvencyProtectionBps": 8573,
      "userHarmBps": 8200
    }
  ],
  "selectedMode": "THROTTLE"
}
```

## Final Selection

- selectedMode: `THROTTLE`
- rationale: THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=6507
