# Oracle Court Artifact Map (Final Submission Set)

## Canonical Story Scope

- Scenario A: Healthy evidence + telemetry -> `NORMAL`
- Scenario B: Stressed evidence + telemetry -> `THROTTLE`

## Files

- `artifacts/oracle-court-canonical-proof.json`
  - Canonical machine-readable package covering **both scenarios** with tx hashes and vault policy outcomes.

- `artifacts/oracle-court-proof-package.md`
  - Human-scannable summary of **both scenarios** (one-line story, matrix, final enforced state).

- `artifacts/oracle-court-policy-impact.md`
  - Canonical before/after policy impact narrative (healthy -> stressed).

- `artifacts/oracle-court-healthy-scenario.json`
  - Scenario A detailed snapshot (inputs, verdict, tx hash, onchain/vault state).

- `artifacts/oracle-court-stressed-scenario.json`
  - Scenario B detailed snapshot (inputs, verdict, tx hash, onchain/vault state).

- `artifacts/evidence-dossier.json`
  - Scenario B (stressed-canonical) evidence dossier with contradiction matrix and evidence root.

- `artifacts/evidence-dossier.md`
  - Scenario B human-readable evidence dossier.

- `artifacts/tribunal-briefs.md`
  - Scenario B adversarial tribunal briefs (prosecutor/defender/auditor) + evidence hashes.

- `artifacts/policy-simulation.md`
  - Scenario B counterfactual mode simulation and selected mode rationale.

- `artifacts/verdict-bulletin.json`
  - Scenario B final verdict bulletin including tx hash, receiver/vault addresses, resulting vault mode, and policy effect.

- `artifacts/oracle-court-proof.md`
  - Scenario B deterministic proof block with onchain readback.
