> Scenario: stressed-canonical (tx: 0x116b46285fec8335894c1359556917187a202faffb2379094073ecc22aced23b)

# Policy Simulation

## Counterfactual Mode Analysis

```json
{
  "explanation": "THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=6505",
  "modeResults": [
    {
      "falsePositiveCostBps": 3289,
      "mode": "NORMAL",
      "objectiveScoreBps": 6253,
      "operationalReversibilityBps": 9300,
      "rationale": "Minimizes user harm but offers the least solvency protection.",
      "solvencyProtectionBps": 5369,
      "userHarmBps": 1200
    },
    {
      "falsePositiveCostBps": 2606,
      "mode": "THROTTLE",
      "objectiveScoreBps": 6505,
      "operationalReversibilityBps": 7600,
      "rationale": "Balances containment with user access while preserving reversibility.",
      "solvencyProtectionBps": 7569,
      "userHarmBps": 4300
    },
    {
      "falsePositiveCostBps": 3812,
      "mode": "REDEMPTION_ONLY",
      "objectiveScoreBps": 5244,
      "operationalReversibilityBps": 3000,
      "rationale": "Maximizes solvency containment under contradiction-heavy evidence.",
      "solvencyProtectionBps": 8569,
      "userHarmBps": 8200
    }
  ],
  "selectedMode": "THROTTLE"
}
```

## Final Selection

- selectedMode: `THROTTLE`
- rationale: THROTTLE selected by counterfactual policy simulation: Balances containment with user access while preserving reversibility. objective=6505
