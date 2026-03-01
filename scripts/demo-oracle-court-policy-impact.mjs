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

const run = (command, extraEnv = {}) => {
  const output = execSync(command, {
    cwd: projectRoot,
    env: {
      ...process.env,
      ...extraEnv,
    },
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 25 * 1024 * 1024,
  })

  return output
}

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

const readState = () => {
  const output = run('node scripts/read-oracle-court-state.mjs')
  return JSON.parse(output)
}

const setTelemetry = ({ reserveCoverageBps, attestationAgeSeconds, redemptionQueueBps }) => {
  run('node scripts/set-oracle-court-rwa-telemetry.mjs', {
    CRE_ETH_PRIVATE_KEY: PRIVATE_KEY,
    ORACLE_COURT_RESERVE_COVERAGE_BPS: String(reserveCoverageBps),
    ORACLE_COURT_ATTESTATION_AGE_SECONDS: String(attestationAgeSeconds),
    ORACLE_COURT_REDEMPTION_QUEUE_BPS: String(redemptionQueueBps),
  })
}

// Baseline scenario: healthy RWA telemetry
setTelemetry({
  reserveCoverageBps: 10000,
  attestationAgeSeconds: 300,
  redemptionQueueBps: 200,
})
const baselineRun = runBroadcast()
const baselineState = readState()

// Stress scenario: reserve shortfall + stale attestation + redemption queue pressure
setTelemetry({
  reserveCoverageBps: 9400,
  attestationAgeSeconds: 172800,
  redemptionQueueBps: 2800,
})
const stressRun = runBroadcast()
const stressState = readState()

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
}

const markdown = `# Oracle Court Policy Impact Demo\n\nThis artifact demonstrates **court verdict -> protocol behavior change** under healthy vs stressed RWA telemetry.\n\n## Deterministic Before/After Snapshot\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n\n## Interpretation\n\n- Baseline run should remain in \`NORMAL\` with minting enabled.\n- Stress run should move to \`THROTTLE\` or \`REDEMPTION_ONLY\`, reducing or disabling minting via vault policy.\n- Compare \`vaultState.canMint5000\` across both runs to verify enforceable protocol impact.\n`

fs.mkdirSync(path.dirname(artifactPath), { recursive: true })
fs.writeFileSync(artifactPath, markdown, 'utf8')

console.log(`Policy impact artifact written: ${artifactPath}`)
console.log(`Baseline tx: ${baselineRun.txHash}`)
console.log(`Stress tx:   ${stressRun.txHash}`)
