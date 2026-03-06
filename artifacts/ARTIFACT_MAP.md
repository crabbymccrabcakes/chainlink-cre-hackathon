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
  - Scenario C (appeal-canonical) evidence dossier with contradiction matrix and evidence root.

- `artifacts/evidence-dossier.md`
  - Scenario C human-readable evidence dossier.

- `artifacts/tribunal-briefs.md`
  - Scenario C adversarial tribunal briefs (prosecutor/defender/auditor) + evidence hashes.

- `artifacts/policy-simulation.md`
  - Scenario C counterfactual mode simulation and selected mode rationale.

- `artifacts/verdict-bulletin.json`
  - Scenario C final verdict bulletin including tx hash, receiver/vault addresses, resulting vault mode, and action proof.

- `artifacts/oracle-court-proof.md`
  - Scenario C deterministic proof block with onchain readback.
