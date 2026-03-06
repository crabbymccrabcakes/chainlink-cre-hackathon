> Scenario: appeal-canonical (tx: 0x4128f84408bb25e7589a1346f1db07eaf825d478500265851a61ef10ef5c3d0d)

# Policy Simulation

## Counterfactual Mode Analysis

```json
{
  "explanation": "NORMAL selected by counterfactual policy simulation: Minimizes user harm but offers the least solvency protection. objective=6308",
  "modeResults": [
    {
      "falsePositiveCostBps": 3148,
      "mode": "NORMAL",
      "objectiveScoreBps": 6308,
      "operationalReversibilityBps": 9300,
      "rationale": "Minimizes user harm but offers the least solvency protection.",
      "solvencyProtectionBps": 4967,
      "userHarmBps": 1200
    },
    {
      "falsePositiveCostBps": 2687,
      "mode": "THROTTLE",
      "objectiveScoreBps": 6155,
      "operationalReversibilityBps": 7600,
      "rationale": "Balances containment with user access while preserving reversibility.",
      "solvencyProtectionBps": 6367,
      "userHarmBps": 4300
    },
    {
      "falsePositiveCostBps": 3973,
      "mode": "REDEMPTION_ONLY",
      "objectiveScoreBps": 4878,
      "operationalReversibilityBps": 3000,
      "rationale": "Maximizes solvency containment under contradiction-heavy evidence.",
      "solvencyProtectionBps": 7367,
      "userHarmBps": 8200
    }
  ],
  "selectedMode": "NORMAL"
}
```

## Final Selection

- selectedMode: `NORMAL`
- rationale: NORMAL selected by counterfactual policy simulation: Minimizes user harm but offers the least solvency protection. objective=6308
