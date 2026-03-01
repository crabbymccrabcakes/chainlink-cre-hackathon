import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

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
  },
]

const snapshots = {}

for (const scenario of scenarios) {
  setTelemetry(scenario.telemetry)
  const broadcast = runBroadcast()
  const state = readState()
  const verdictBulletin = readJsonFile(verdictBulletinPath)
  const evidenceDossier = readJsonFile(evidenceDossierPath)

  snapshots[scenario.key] = {
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
  }

  const scenarioPath = path.join(artifactsDir, `oracle-court-${scenario.key}-scenario.json`)
  fs.writeFileSync(scenarioPath, `${JSON.stringify(snapshots[scenario.key], null, 2)}\n`, 'utf8')
}

const healthy = snapshots.healthy
const stressed = snapshots.stressed

const canonicalPackage = {
  packageVersion: 'oracle-court-canonical-proof-v1',
  generatedAtIso: new Date().toISOString(),
  story: 'healthy evidence -> NORMAL, stressed evidence -> THROTTLE, immediate onchain policy impact',
  receiverAddress: stressed.receiverAddress,
  vaultAddress: stressed.vaultAddress,
  scenarios: {
    healthy: {
      title: healthy.title,
      txHash: healthy.txHash,
      modeLabel: healthy.simulationResult?.modeLabel || healthy.verdictBulletin.mode,
      mode: healthy.simulationResult?.mode ?? healthy.receiverState.latestMode,
      riskScoreBps: healthy.simulationResult?.riskScoreBps || healthy.receiverState.latestRiskScoreBps,
      evidenceRoot: healthy.verdictBulletin.evidenceRoot,
      verdictDigest: healthy.verdictBulletin.verdictDigest,
      vaultPolicy: {
        riskMode: healthy.vaultState.riskMode,
        canMint1000: healthy.vaultState.canMint1000,
        canMint5000: healthy.vaultState.canMint5000,
        canRedeem1000: healthy.vaultState.canRedeem1000,
      },
    },
    stressed: {
      title: stressed.title,
      txHash: stressed.txHash,
      modeLabel: stressed.simulationResult?.modeLabel || stressed.verdictBulletin.mode,
      mode: stressed.simulationResult?.mode ?? stressed.receiverState.latestMode,
      riskScoreBps: stressed.simulationResult?.riskScoreBps || stressed.receiverState.latestRiskScoreBps,
      evidenceRoot: stressed.verdictBulletin.evidenceRoot,
      verdictDigest: stressed.verdictBulletin.verdictDigest,
      vaultPolicy: {
        riskMode: stressed.vaultState.riskMode,
        canMint1000: stressed.vaultState.canMint1000,
        canMint5000: stressed.vaultState.canMint5000,
        canRedeem1000: stressed.vaultState.canRedeem1000,
      },
    },
  },
}

const packageJsonPath = path.join(artifactsDir, 'oracle-court-canonical-proof.json')
fs.writeFileSync(packageJsonPath, `${JSON.stringify(canonicalPackage, null, 2)}\n`, 'utf8')

const quickRow = (scenario) =>
  `| ${scenario.title} | ${scenario.txHash} | ${scenario.simulationResult?.modeLabel || scenario.verdictBulletin.mode} | ${scenario.simulationResult?.riskScoreBps || scenario.receiverState.latestRiskScoreBps} | ${scenario.vaultState.canMint5000} | ${scenario.vaultState.canRedeem1000} |`

const packageMarkdown = `# Oracle Court Canonical Proof Package\n\n## One-line Story\n\nHealthy evidence + telemetry keeps policy in \`NORMAL\`.\nStressed evidence + contradictions escalates policy to \`THROTTLE\`.\nBoth verdicts are committed onchain and immediately affect vault mint policy.\n\n## Canonical Addresses\n\n- receiverAddress: \`${stressed.receiverAddress}\`\n- vaultAddress: \`${stressed.vaultAddress}\`\n\n## Scenario Matrix\n\n| Scenario | Tx Hash | Mode | Risk Score (bps) | canMint5000 | canRedeem1000 |\n|---|---|---|---:|---:|---:|\n${quickRow(healthy)}\n${quickRow(stressed)}\n\n## Healthy Scenario Inputs\n\n\`\`\`json\n${JSON.stringify(healthy.telemetry, null, 2)}\n\`\`\`\n\n## Stressed Scenario Inputs\n\n\`\`\`json\n${JSON.stringify(stressed.telemetry, null, 2)}\n\`\`\`\n\n## Final Enforced State (after stressed scenario)\n\n\`\`\`json\n${JSON.stringify(stressed.vaultState, null, 2)}\n\`\`\`\n`

const packageMarkdownPath = path.join(artifactsDir, 'oracle-court-proof-package.md')
fs.writeFileSync(packageMarkdownPath, packageMarkdown, 'utf8')

const policyImpactMarkdown = `# Oracle Court Policy Impact (Canonical)\n\nThis artifact uses a single canonical before/after flow.\n\n- Before: healthy inputs -> \`NORMAL\` -> minting allowed\n- After: stressed inputs -> \`THROTTLE\` -> minting restricted by policy\n\n## Snapshot\n\n\`\`\`json\n${JSON.stringify(canonicalPackage, null, 2)}\n\`\`\`\n`

fs.writeFileSync(path.join(artifactsDir, 'oracle-court-policy-impact.md'), policyImpactMarkdown, 'utf8')

const verdictBulletinCanonical = {
  ...stressed.verdictBulletin,
  scenario: 'stressed-canonical',
  txHash: stressed.txHash,
  receiverAddress: stressed.receiverAddress,
  vaultAddress: stressed.vaultAddress,
  resultingVaultMode: stressed.vaultState.riskMode,
  policyEffect: {
    canMint1000: stressed.vaultState.canMint1000,
    canMint5000: stressed.vaultState.canMint5000,
    canRedeem1000: stressed.vaultState.canRedeem1000,
  },
}

fs.writeFileSync(verdictBulletinPath, `${JSON.stringify(verdictBulletinCanonical, null, 2)}\n`, 'utf8')

const evidenceDossierCanonical = {
  ...stressed.evidenceDossier,
  scenario: 'stressed-canonical',
  txHash: stressed.txHash,
}
fs.writeFileSync(evidenceDossierPath, `${JSON.stringify(evidenceDossierCanonical, null, 2)}\n`, 'utf8')

const policySimulationText = fs.readFileSync(policySimulationPath, 'utf8')
fs.writeFileSync(
  policySimulationPath,
  `> Scenario: stressed-canonical (tx: ${stressed.txHash})\n\n${policySimulationText}`,
  'utf8',
)

const tribunalBriefsText = fs.readFileSync(tribunalBriefsPath, 'utf8')
fs.writeFileSync(
  tribunalBriefsPath,
  `> Scenario: stressed-canonical (tx: ${stressed.txHash})\n\n${tribunalBriefsText}`,
  'utf8',
)

console.log(`Canonical proof package written: ${packageJsonPath}`)
console.log(`Canonical proof markdown written: ${packageMarkdownPath}`)
console.log(`Policy impact artifact updated: ${path.join(artifactsDir, 'oracle-court-policy-impact.md')}`)
console.log(`Healthy tx: ${healthy.txHash}`)
console.log(`Stressed tx: ${stressed.txHash}`)
