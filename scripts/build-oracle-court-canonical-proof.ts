import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

import {
  executeVaultActionPlan,
  type VaultActionOutcome,
  type VaultActionPlanItem,
} from './oracle-court-vault-actions.ts'

const projectRoot = process.cwd()

const privateKey = process.env.CRE_ETH_PRIVATE_KEY
if (!privateKey) {
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

const parseTxHashFromBroadcastOutput = (output) => {
  const matches = [...output.matchAll(/Write report transaction succeeded:\s*(0x[a-fA-F0-9]{64})/g)]
  if (matches.length === 0) {
    throw new Error('Could not parse tx hash from broadcast output')
  }
  return matches[matches.length - 1][1]
}

const parseSimulationResultFromOutput = (output) => {
  const marker = '✓ Workflow Simulation Result:'
  const idx = output.indexOf(marker)
  if (idx < 0) return null

  const slice = output.slice(idx + marker.length)
  const start = slice.indexOf('{')
  if (start < 0) return null

  let depth = 0
  let end = -1

  for (let i = start; i < slice.length; i += 1) {
    const ch = slice[i]
    if (ch === '{') depth += 1
    if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }

  if (end < 0) return null

  try {
    return JSON.parse(slice.slice(start, end + 1))
  } catch {
    return null
  }
}

const setTelemetry = (telemetry) => {
  run('bun run set:oracle-court:rwa', {
    CRE_ETH_PRIVATE_KEY: privateKey,
    ORACLE_COURT_RESERVE_COVERAGE_BPS: String(telemetry.reserveCoverageBps),
    ORACLE_COURT_ATTESTATION_AGE_SECONDS: String(telemetry.attestationAgeSeconds),
    ORACLE_COURT_REDEMPTION_QUEUE_BPS: String(telemetry.redemptionQueueBps),
  })
}

const runBroadcast = () => {
  const output = run('bun run simulate:oracle-court:broadcast', {
    CRE_ETH_PRIVATE_KEY: privateKey,
  })

  return {
    txHash: parseTxHashFromBroadcastOutput(output),
    simulationResult: parseSimulationResultFromOutput(output),
    rawOutput: output,
  }
}

const readState = () => JSON.parse(run('bun run read:oracle-court:state'))

const readJsonFile = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const artifactsDir = path.join(projectRoot, 'artifacts')
const evidenceDossierPath = path.join(artifactsDir, 'evidence-dossier.json')
const verdictBulletinPath = path.join(artifactsDir, 'verdict-bulletin.json')
const policySimulationPath = path.join(artifactsDir, 'policy-simulation.md')
const tribunalBriefsPath = path.join(artifactsDir, 'tribunal-briefs.md')

const scenarios = [
  {
    key: 'healthy',
    title: 'Scenario A — Healthy evidence and telemetry',
    telemetry: {
      reserveCoverageBps: 10000,
      attestationAgeSeconds: 300,
      redemptionQueueBps: 200,
    },
    expectedModeLabel: 'NORMAL',
    actionPlan: [
      { label: 'healthy-mint-5000', kind: 'mint', amount: 5000n },
      { label: 'healthy-redeem-1000', kind: 'redeem', amount: 1000n },
    ] satisfies VaultActionPlanItem[],
  },
  {
    key: 'stressed',
    title: 'Scenario B — Stressed evidence and telemetry',
    telemetry: {
      reserveCoverageBps: 9400,
      attestationAgeSeconds: 172800,
      redemptionQueueBps: 2800,
    },
    expectedModeLabel: 'THROTTLE',
    actionPlan: [
      { label: 'stressed-mint-5000', kind: 'mint', amount: 5000n, expectedStatus: 'REVERTED' },
      { label: 'stressed-redeem-1000', kind: 'redeem', amount: 1000n },
    ] satisfies VaultActionPlanItem[],
  },
  {
    key: 'appeal',
    title: 'Scenario C — Appeal / retrial evidence and telemetry',
    telemetry: {
      reserveCoverageBps: 9900,
      attestationAgeSeconds: 7200,
      redemptionQueueBps: 700,
    },
    expectedModeLabel: 'NORMAL',
    actionPlan: [
      { label: 'appeal-mint-5000', kind: 'mint', amount: 5000n },
      { label: 'appeal-redeem-1000', kind: 'redeem', amount: 1000n },
    ] satisfies VaultActionPlanItem[],
  },
]

const snapshots = {}

const findActionOutcome = (
  outcomes: VaultActionOutcome[],
  label: string,
): VaultActionOutcome | null => outcomes.find((outcome) => outcome.label === label) || null

for (const scenario of scenarios) {
  setTelemetry(scenario.telemetry)
  const broadcast = runBroadcast()
  const state = readState()
  const verdictBulletin = readJsonFile(verdictBulletinPath)
  const evidenceDossier = readJsonFile(evidenceDossierPath)
  const actionProof = await executeVaultActionPlan(scenario.actionPlan)

  snapshots[scenario.key] = {
    key: scenario.key,
    title: scenario.title,
    expectedModeLabel: scenario.expectedModeLabel,
    telemetry: scenario.telemetry,
    txHash: broadcast.txHash,
    simulationResult: broadcast.simulationResult,
    verdictBulletin,
    evidenceDossier,
    receiverAddress: state.receiverAddress,
    vaultAddress: state.vaultAddress,
    receiverState: state.receiverState,
    vaultState: state.vaultState,
    actionProof,
  }

  const scenarioPath = path.join(artifactsDir, `oracle-court-${scenario.key}-scenario.json`)
  fs.writeFileSync(scenarioPath, `${JSON.stringify(snapshots[scenario.key], null, 2)}\n`, 'utf8')
}

const healthy = snapshots.healthy
const stressed = snapshots.stressed
const appeal = snapshots.appeal

const canonicalPackage = {
  packageVersion: 'oracle-court-canonical-proof-v2',
  generatedAtIso: new Date().toISOString(),
  story:
    'healthy verdict enables mint/redeem, stressed verdict produces a reverted large-mint proof onchain, appeal/retrial records the follow-up execution posture onchain',
  receiverAddress: appeal.receiverAddress,
  vaultAddress: appeal.vaultAddress,
  scenarios: {
    healthy: {
      title: healthy.title,
      txHash: healthy.txHash,
      modeLabel: healthy.simulationResult?.modeLabel || healthy.verdictBulletin.mode,
      mode: healthy.simulationResult?.mode ?? healthy.receiverState.latestMode,
      policyModeLabel: healthy.simulationResult?.policyModeLabel || healthy.verdictBulletin.policyMode || null,
      policyMode: healthy.simulationResult?.policyMode ?? null,
      riskScoreBps: healthy.simulationResult?.riskScoreBps || healthy.receiverState.latestRiskScoreBps,
      evidenceRoot: healthy.verdictBulletin.evidenceRoot,
      verdictDigest: healthy.verdictBulletin.verdictDigest,
      actionProof: healthy.actionProof,
      vaultState: healthy.vaultState,
      postActionVaultState: healthy.actionProof.finalState,
    },
    stressed: {
      title: stressed.title,
      txHash: stressed.txHash,
      modeLabel: stressed.simulationResult?.modeLabel || stressed.verdictBulletin.mode,
      mode: stressed.simulationResult?.mode ?? stressed.receiverState.latestMode,
      policyModeLabel:
        stressed.simulationResult?.policyModeLabel || stressed.verdictBulletin.policyMode || null,
      policyMode: stressed.simulationResult?.policyMode ?? null,
      riskScoreBps: stressed.simulationResult?.riskScoreBps || stressed.receiverState.latestRiskScoreBps,
      evidenceRoot: stressed.verdictBulletin.evidenceRoot,
      verdictDigest: stressed.verdictBulletin.verdictDigest,
      actionProof: stressed.actionProof,
      vaultState: stressed.vaultState,
      postActionVaultState: stressed.actionProof.finalState,
    },
    appeal: {
      title: appeal.title,
      txHash: appeal.txHash,
      modeLabel: appeal.simulationResult?.modeLabel || appeal.verdictBulletin.mode,
      mode: appeal.simulationResult?.mode ?? appeal.receiverState.latestMode,
      policyModeLabel: appeal.simulationResult?.policyModeLabel || appeal.verdictBulletin.policyMode || null,
      policyMode: appeal.simulationResult?.policyMode ?? null,
      riskScoreBps: appeal.simulationResult?.riskScoreBps || appeal.receiverState.latestRiskScoreBps,
      evidenceRoot: appeal.verdictBulletin.evidenceRoot,
      verdictDigest: appeal.verdictBulletin.verdictDigest,
      actionProof: appeal.actionProof,
      vaultState: appeal.vaultState,
      postActionVaultState: appeal.actionProof.finalState,
    },
  },
}

const packageJsonPath = path.join(artifactsDir, 'oracle-court-canonical-proof.json')
fs.writeFileSync(packageJsonPath, `${JSON.stringify(canonicalPackage, null, 2)}\n`, 'utf8')

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
  `| ${scenario.title} | ${scenario.txHash} | ${scenario.simulationResult?.modeLabel || scenario.verdictBulletin.mode} | ${scenario.simulationResult?.policyModeLabel || scenario.verdictBulletin.policyMode || 'n/a'} | ${scenario.simulationResult?.riskScoreBps || scenario.receiverState.latestRiskScoreBps} | ${describeAction(findActionOutcome(scenario.actionProof.outcomes, `${scenario.key}-mint-5000`))} | ${describeAction(findActionOutcome(scenario.actionProof.outcomes, `${scenario.key}-redeem-1000`))} |`

const actionEvidenceSection = (scenario) => {
  const mintOutcome = findActionOutcome(scenario.actionProof.outcomes, `${scenario.key}-mint-5000`)
  const redeemOutcome = findActionOutcome(scenario.actionProof.outcomes, `${scenario.key}-redeem-1000`)

  return `### ${scenario.title}

- tribunalTx: \`${scenario.txHash}\`
- effectiveMode: \`${scenario.simulationResult?.modeLabel || scenario.verdictBulletin.mode}\`
- policyMode: \`${scenario.simulationResult?.policyModeLabel || scenario.verdictBulletin.policyMode || 'n/a'}\`
- mint5000: ${describeAction(mintOutcome)}
- redeem1000: ${describeAction(redeemOutcome)}
`
}

const packageMarkdown = `# Oracle Court Canonical Proof Package\n\n## One-line Story\n\nHealthy evidence + telemetry enables real mint/redeem execution.\nStressed evidence forces a reverted large-mint transaction under the effective policy mode.\nAppeal / retrial records the follow-up execution posture on the upgraded docketed stack.\n\n## Canonical Addresses\n\n- receiverAddress: \`${appeal.receiverAddress}\`\n- vaultAddress: \`${appeal.vaultAddress}\`\n- execution actor: \`${appeal.actionProof.actorAddress}\`\n\n## Scenario Matrix\n\n| Scenario | Tribunal Tx | Effective Mode | Policy Mode | Risk Score (bps) | Large Mint 5000 | Redeem 1000 |\n|---|---|---|---|---:|---|---|\n${quickRow(healthy)}\n${quickRow(stressed)}\n${quickRow(appeal)}\n\n## Action Evidence\n\n${actionEvidenceSection(healthy)}\n${actionEvidenceSection(stressed)}\n${actionEvidenceSection(appeal)}\n## Healthy Scenario Inputs\n\n\`\`\`json\n${JSON.stringify(healthy.telemetry, null, 2)}\n\`\`\`\n\n## Stressed Scenario Inputs\n\n\`\`\`json\n${JSON.stringify(stressed.telemetry, null, 2)}\n\`\`\`\n\n## Appeal Scenario Inputs\n\n\`\`\`json\n${JSON.stringify(appeal.telemetry, null, 2)}\n\`\`\`\n\n## Final Enforced State (after appeal post-verdict actions)\n\n\`\`\`json\n${JSON.stringify(appeal.actionProof.finalState, null, 2)}\n\`\`\`\n`

const packageMarkdownPath = path.join(artifactsDir, 'oracle-court-proof-package.md')
fs.writeFileSync(packageMarkdownPath, packageMarkdown, 'utf8')

const policyImpactMarkdown = `# Oracle Court Policy Impact (Canonical)\n\nThis artifact uses a judge-scannable execution flow.\n\n- Healthy: tribunal write followed by successful user actions.\n- Stressed: tribunal write followed by an onchain large-mint revert under the effective restriction.\n- Appeal: tribunal write followed by a second execution check on the linked follow-up case.\n\n## Snapshot\n\n\`\`\`json\n${JSON.stringify(canonicalPackage, null, 2)}\n\`\`\`\n`

fs.writeFileSync(path.join(artifactsDir, 'oracle-court-policy-impact.md'), policyImpactMarkdown, 'utf8')

const verdictBulletinCanonical = {
  ...appeal.verdictBulletin,
  scenario: 'appeal-canonical',
  txHash: appeal.txHash,
  receiverAddress: appeal.receiverAddress,
  vaultAddress: appeal.vaultAddress,
  resultingVaultMode: appeal.actionProof.finalState.riskMode,
  actionProof: appeal.actionProof,
  postActionVaultState: appeal.actionProof.finalState,
}

fs.writeFileSync(verdictBulletinPath, `${JSON.stringify(verdictBulletinCanonical, null, 2)}\n`, 'utf8')

const evidenceDossierCanonical = {
  ...appeal.evidenceDossier,
  scenario: 'appeal-canonical',
  txHash: appeal.txHash,
}
fs.writeFileSync(evidenceDossierPath, `${JSON.stringify(evidenceDossierCanonical, null, 2)}\n`, 'utf8')

const policySimulationText = fs.readFileSync(policySimulationPath, 'utf8')
fs.writeFileSync(
  policySimulationPath,
  `> Scenario: appeal-canonical (tx: ${appeal.txHash})\n\n${policySimulationText}`,
  'utf8',
)

const tribunalBriefsText = fs.readFileSync(tribunalBriefsPath, 'utf8')
fs.writeFileSync(
  tribunalBriefsPath,
  `> Scenario: appeal-canonical (tx: ${appeal.txHash})\n\n${tribunalBriefsText}`,
  'utf8',
)

console.log(`Canonical proof package written: ${packageJsonPath}`)
console.log(`Canonical proof markdown written: ${packageMarkdownPath}`)
console.log(`Policy impact artifact updated: ${path.join(artifactsDir, 'oracle-court-policy-impact.md')}`)
console.log(`Healthy tx: ${healthy.txHash}`)
console.log(`Stressed tx: ${stressed.txHash}`)
console.log(`Appeal tx: ${appeal.txHash}`)
