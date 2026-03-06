import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execSync } from 'node:child_process'

import {
  executeVaultActionPlan,
  type VaultActionOutcome,
  type VaultActionPlanItem,
} from './oracle-court-vault-actions.ts'

const projectRoot = process.cwd()
const artifactPath = path.join(projectRoot, 'artifacts', 'oracle-court-policy-impact.md')

const PRIVATE_KEY = process.env.CRE_ETH_PRIVATE_KEY
if (!PRIVATE_KEY) {
  throw new Error('Missing CRE_ETH_PRIVATE_KEY in environment')
}

const run = (command, extraEnv = {}) =>
  execSync(command, {
    cwd: projectRoot,
    env: {
      ...process.env,
      ...extraEnv,
    },
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 25 * 1024 * 1024,
  })

const runBroadcast = () => {
  const output = run('bun run simulate:oracle-court:broadcast', {
    CRE_ETH_PRIVATE_KEY: PRIVATE_KEY,
  })

  const txMatch = output.match(/Write report transaction succeeded:\s*(0x[a-fA-F0-9]{64})/)
  if (!txMatch) {
    throw new Error('Could not parse broadcast tx hash from simulate output')
  }

  return {
    txHash: txMatch[1],
    rawOutput: output,
  }
}

const readState = () => JSON.parse(run('bun run read:oracle-court:state'))

const setTelemetry = ({ reserveCoverageBps, attestationAgeSeconds, redemptionQueueBps }) => {
  run('bun run set:oracle-court:rwa', {
    CRE_ETH_PRIVATE_KEY: PRIVATE_KEY,
    ORACLE_COURT_RESERVE_COVERAGE_BPS: String(reserveCoverageBps),
    ORACLE_COURT_ATTESTATION_AGE_SECONDS: String(attestationAgeSeconds),
    ORACLE_COURT_REDEMPTION_QUEUE_BPS: String(redemptionQueueBps),
  })
}

const modeLabelFromValue = (mode: number): string => {
  switch (mode) {
    case 0:
      return 'NORMAL'
    case 1:
      return 'THROTTLE'
    case 2:
      return 'REDEMPTION_ONLY'
    default:
      return `UNKNOWN(${mode})`
  }
}

const scenarios = [
  {
    key: 'baseline',
    label: 'Healthy',
    telemetry: {
      reserveCoverageBps: 10000,
      attestationAgeSeconds: 300,
      redemptionQueueBps: 200,
    },
    actionPlan: [
      { label: 'baseline-mint-5000', kind: 'mint', amount: 5000n },
      { label: 'baseline-redeem-1000', kind: 'redeem', amount: 1000n },
    ] satisfies VaultActionPlanItem[],
  },
  {
    key: 'stress',
    label: 'Stressed',
    telemetry: {
      reserveCoverageBps: 9400,
      attestationAgeSeconds: 172800,
      redemptionQueueBps: 2800,
    },
    actionPlan: [
      { label: 'stress-mint-5000', kind: 'mint', amount: 5000n, expectedStatus: 'REVERTED' },
      { label: 'stress-redeem-1000', kind: 'redeem', amount: 1000n },
    ] satisfies VaultActionPlanItem[],
  },
  {
    key: 'appeal',
    label: 'Appeal',
    telemetry: {
      reserveCoverageBps: 9900,
      attestationAgeSeconds: 7200,
      redemptionQueueBps: 700,
    },
    actionPlan: [
      { label: 'appeal-mint-5000', kind: 'mint', amount: 5000n },
      { label: 'appeal-redeem-1000', kind: 'redeem', amount: 1000n },
    ] satisfies VaultActionPlanItem[],
  },
]

const report = {
  generatedAtIso: new Date().toISOString(),
  scenarios: {} as Record<string, any>,
}

for (const scenario of scenarios) {
  setTelemetry(scenario.telemetry)
  const broadcast = runBroadcast()
  const state = readState()
  const actionProof = await executeVaultActionPlan(scenario.actionPlan)

  report.scenarios[scenario.key] = {
    key: scenario.key,
    label: scenario.label,
    telemetry: scenario.telemetry,
    txHash: broadcast.txHash,
    receiverState: state.receiverState,
    vaultState: state.vaultState,
    actionProof,
  }
}

const baseline = report.scenarios.baseline
const stress = report.scenarios.stress
const appeal = report.scenarios.appeal

const findActionOutcome = (outcomes: VaultActionOutcome[], label: string): VaultActionOutcome | null =>
  outcomes.find((outcome) => outcome.label === label) || null

const describeAction = (action: VaultActionOutcome | null): string => {
  if (!action) return 'n/a'
  if (action.status === 'SUCCESS') {
    return `SUCCESS (${action.kind} ${action.amount}, delta=${action.actorBalanceDelta}, tx=${action.txHash})`
  }
  if (action.status === 'REVERTED') {
    return `REVERTED (${action.kind} ${action.amount}, tx=${action.txHash})`
  }

  return `BLOCKED (${action.kind} ${action.amount}, error=${action.error})`
}

const quickRow = (scenario) =>
  `| ${scenario.label} | ${scenario.txHash} | ${modeLabelFromValue(scenario.receiverState.latestMode)} | ${scenario.receiverState.latestRiskScoreBps} | ${describeAction(findActionOutcome(scenario.actionProof.outcomes, `${scenario.key}-mint-5000`))} | ${describeAction(findActionOutcome(scenario.actionProof.outcomes, `${scenario.key}-redeem-1000`))} |`

const markdown = `# Oracle Court Policy Impact Demo\n\nThis artifact demonstrates **court verdict -> protocol behavior change** across healthy, stressed, and appeal/retrial scenarios.\n\n## Execution Matrix\n\n| Scenario | Tribunal Tx | Effective Mode | Risk Score (bps) | Large Mint 5000 | Redeem 1000 |\n|---|---|---|---:|---|---|\n${quickRow(baseline)}\n${quickRow(stress)}\n${quickRow(appeal)}\n\n## Deterministic Snapshot\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n\n## Interpretation\n\n- Healthy records successful mint and redeem transactions.\n- Stressed is expected to produce an onchain revert for the large mint while redeem remains testable.\n- Appeal records the follow-up execution posture after improved telemetry and linked case handling.\n- If the stressed mint does not revert onchain, the script fails because the proof target was not met.\n`

fs.mkdirSync(path.dirname(artifactPath), { recursive: true })
fs.writeFileSync(artifactPath, markdown, 'utf8')

console.log(`Policy impact artifact written: ${artifactPath}`)
console.log(`Baseline tx: ${baseline.txHash}`)
console.log(`Stress tx:   ${stress.txHash}`)
console.log(`Appeal tx:   ${appeal.txHash}`)
