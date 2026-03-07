# Oracle Court Artifact Map (Final Submission Set)

## Canonical Story Scope

- Scenario A: Healthy evidence + telemetry -> `NORMAL`
- Scenario B: Stressed evidence + telemetry -> `THROTTLE`
- Scenario C: Appeal / retrial evidence + telemetry -> `NORMAL`

## Files

- `artifacts/oracle-court-canonical-proof.json`
  - Canonical machine-readable package covering **all three scenarios** with tribunal tx hashes, post-verdict action tx hashes, and vault policy outcomes.

- `artifacts/oracle-court-proof-package.md`
  - Human-scannable summary of **all three scenarios** (one-line story, action matrix, final enforced state).

- `artifacts/oracle-court-policy-impact.md`
  - Canonical execution narrative (healthy -> stressed -> appeal).

- `artifacts/oracle-court-healthy-scenario.json`
  - Scenario A detailed snapshot (inputs, verdict, tribunal tx hash, action tx hashes, onchain/vault state).

- `artifacts/oracle-court-stressed-scenario.json`
  - Scenario B detailed snapshot (inputs, verdict, tribunal tx hash, reverted mint tx hash, redeem tx hash, onchain/vault state).

- `artifacts/oracle-court-appeal-scenario.json`
  - Scenario C detailed snapshot (inputs, verdict, tribunal tx hash, action tx hashes, onchain/vault state).

- `artifacts/evidence-dossier.json`
  - Latest single-run Sepolia proof dossier, including contradiction matrix and evidence root for the model-backed workflow run.

- `artifacts/evidence-dossier.md`
  - Human-readable version of the latest single-run Sepolia proof dossier.

- `artifacts/tribunal-briefs.md`
  - Latest single-run adversarial tribunal briefs (prosecutor/defender/auditor) + evidence hashes. This file now includes `modelGeneration.status=APPLIED` and the attached schema-validated findings.

- `artifacts/policy-simulation.md`
  - Latest single-run counterfactual mode simulation and selected mode rationale.

- `artifacts/verdict-bulletin.json`
  - Latest single-run final verdict bulletin including model-generation status, tx hash, receiver/vault addresses, and resulting vault mode.

- `artifacts/oracle-court-proof.md`
  - Latest single-run proof block with onchain readback and model-generation summary.
