import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execSync } from 'node:child_process'

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

const readState = () => JSON.parse(run('node scripts/read-oracle-court-state.mjs'))

const setTelemetry = ({ reserveCoverageBps, attestationAgeSeconds, redemptionQueueBps }) => {
  run('node scripts/set-oracle-court-rwa-telemetry.mjs', {
    CRE_ETH_PRIVATE_KEY: PRIVATE_KEY,
    ORACLE_COURT_RESERVE_COVERAGE_BPS: String(reserveCoverageBps),
    ORACLE_COURT_ATTESTATION_AGE_SECONDS: String(attestationAgeSeconds),
    ORACLE_COURT_REDEMPTION_QUEUE_BPS: String(redemptionQueueBps),
  })
}

// 1) Baseline scenario: healthy telemetry
setTelemetry({ reserveCoverageBps: 10000, attestationAgeSeconds: 300, redemptionQueueBps: 200 })
const baselineRun = runBroadcast()
const baselineState = readState()

// 2) Stress scenario: reserve shortfall + stale attestation + queue pressure
setTelemetry({ reserveCoverageBps: 9400, attestationAgeSeconds: 172800, redemptionQueueBps: 2800 })
const stressRun = runBroadcast()
const stressState = readState()

// 3) Appeal scenario: new evidence + improved telemetry should relax severity
setTelemetry({ reserveCoverageBps: 9900, attestationAgeSeconds: 7200, redemptionQueueBps: 700 })
const appealRun = runBroadcast()
const appealState = readState()

const report = {
  generatedAtIso: new Date().toISOString(),
  baseline: {
    telemetry: {
      reserveCoverageBps: 10000,
      attestationAgeSeconds: 300,
      redemptionQueueBps: 200,
    },
    txHash: baselineRun.txHash,
    receiverState: baselineState.receiverState,
    vaultState: baselineState.vaultState,
  },
  stress: {
    telemetry: {
      reserveCoverageBps: 9400,
      attestationAgeSeconds: 172800,
      redemptionQueueBps: 2800,
    },
    txHash: stressRun.txHash,
    receiverState: stressState.receiverState,
    vaultState: stressState.vaultState,
  },
  appeal: {
    telemetry: {
      reserveCoverageBps: 9900,
      attestationAgeSeconds: 7200,
      redemptionQueueBps: 700,
    },
    txHash: appealRun.txHash,
    receiverState: appealState.receiverState,
    vaultState: appealState.vaultState,
  },
}

const markdown = `# Oracle Court Policy Impact Demo\n\nThis artifact demonstrates **court verdict -> protocol behavior change** across healthy, stressed, and appeal/retrial scenarios.\n\n## Deterministic Snapshot\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n\n## Interpretation\n\n- Baseline should remain \`NORMAL\` with minting enabled.\n- Stress should move to \`THROTTLE\` or \`REDEMPTION_ONLY\` with tighter mint controls.\n- Appeal scenario simulates new evidence + improved telemetry and may relax mode severity from stress-state.\n- Compare \`canMint5000\` and \`riskMode\` across all three snapshots.\n`

fs.mkdirSync(path.dirname(artifactPath), { recursive: true })
fs.writeFileSync(artifactPath, markdown, 'utf8')

console.log(`Policy impact artifact written: ${artifactPath}`)
console.log(`Baseline tx: ${baselineRun.txHash}`)
console.log(`Stress tx:   ${stressRun.txHash}`)
console.log(`Appeal tx:   ${appealRun.txHash}`)
