# Policy Simulation

## Counterfactual Mode Analysis

```json
{
  "explanation": "THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=7485",
  "modeResults": [
    {
      "falsePositiveCostBps": 4700,
      "mode": "NORMAL",
      "objectiveScoreBps": 7420,
      "operationalReversibilityBps": 9300,
      "rationale": "Minimizes user harm but offers the least solvency protection.",
      "solvencyProtectionBps": 9000,
      "userHarmBps": 1200
    },
    {
      "falsePositiveCostBps": 1800,
      "mode": "THROTTLE",
      "objectiveScoreBps": 7485,
      "operationalReversibilityBps": 7600,
      "rationale": "Balances containment with user access while preserving reversibility.",
      "solvencyProtectionBps": 9800,
      "userHarmBps": 4300
    },
    {
      "falsePositiveCostBps": 2200,
      "mode": "REDEMPTION_ONLY",
      "objectiveScoreBps": 6025,
      "operationalReversibilityBps": 3000,
      "rationale": "Maximizes solvency containment under contradiction-heavy evidence.",
      "solvencyProtectionBps": 10000,
      "userHarmBps": 8200
    }
  ],
  "selectedMode": "THROTTLE"
}
```

## Final Selection

- selectedMode: `NORMAL`
- rationale: THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=7485
