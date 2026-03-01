import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { createPublicClient, http, parseAbi } from 'viem'
import { sepolia } from 'viem/chains'

const projectRoot = process.cwd()

const logPath = path.join(projectRoot, 'artifacts', 'oracle-court-sim-latest.log')
const outputPath = path.join(projectRoot, 'artifacts', 'oracle-court-proof.md')
const deploymentPath = path.join(
  projectRoot,
  'contracts',
  'deployments',
  'sepolia-oracle-court-stack.json',
)

if (!fs.existsSync(logPath)) {
  throw new Error(`Simulation log not found: ${logPath}`)
}

const deployment = fs.existsSync(deploymentPath)
  ? JSON.parse(fs.readFileSync(deploymentPath, 'utf8'))
  : {}

const lines = fs
  .readFileSync(logPath, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)

const tryParseJson = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const extractSimulationResult = () => {
  const index = lines.findIndex((line) => line.includes('✓ Workflow Simulation Result:'))
  if (index < 0) return null

  let depth = 0
  let started = false
  const jsonLines = []

  for (let i = index + 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (!started && line.startsWith('{')) {
      started = true
    }

    if (!started) continue

    jsonLines.push(line)
    depth += (line.match(/\{/g) || []).length
    depth -= (line.match(/\}/g) || []).length

    if (depth === 0) break
  }

  if (jsonLines.length === 0) return null
  return tryParseJson(jsonLines.join('\n'))
}

let txHash = null
let proofBlock = null
let simulationTimestamp = null
let sourceSummary = null

for (const line of lines) {
  const txHashMatch = line.match(/Write report transaction succeeded:\s*(0x[a-fA-F0-9]{64})/)
  if (txHashMatch) {
    txHash = txHashMatch[1]
  }

  const proofTag = '[OracleCourt][ProofBlock] '
  const proofIndex = line.indexOf(proofTag)
  if (proofIndex >= 0) {
    const parsed = tryParseJson(line.slice(proofIndex + proofTag.length))
    if (parsed) {
      proofBlock = parsed
    }
  }

  const summaryMatch = line.match(
    /\[OracleCourt\]\[SourceSummary\] successful=(\d+) failed=(\d+) median=([0-9.]+) min=([0-9.]+) max=([0-9.]+)(?: httpCalls=(\d+)\/(\d+))?/,
  )

  if (summaryMatch) {
    sourceSummary = {
      successful: Number(summaryMatch[1]),
      failed: Number(summaryMatch[2]),
      median: Number(summaryMatch[3]),
      min: Number(summaryMatch[4]),
      max: Number(summaryMatch[5]),
      httpCallsUsed: summaryMatch[6] ? Number(summaryMatch[6]) : null,
      httpCallsMax: summaryMatch[7] ? Number(summaryMatch[7]) : null,
    }
  }

  const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T[^\s]+)/)
  if (timestampMatch) {
    simulationTimestamp = timestampMatch[1]
  }
}

const simulationResult = extractSimulationResult()

if (!txHash && simulationResult?.txHash) {
  txHash = simulationResult.txHash
}

if (!txHash) {
  throw new Error('Could not find transaction hash in simulation logs')
}

const parseAgentArgument = (agentName) => {
  const line = lines.find((entry) => entry.includes(`[OracleCourt][Agent][${agentName}]`))
  if (!line) return null

  const match = line.match(/argument=(\{.*\})\s+evidenceHash=(0x[a-fA-F0-9]{64})/)
  if (!match) return null

  const argument = tryParseJson(match[1])
  return {
    argument,
    evidenceHash: match[2],
  }
}

const prosecutorAgent = parseAgentArgument('PROSECUTOR')
const defenderAgent = parseAgentArgument('DEFENDER')
const auditorAgent = parseAgentArgument('AUDITOR')

const rpcUrl =
  process.env.SEPOLIA_RPC_URL ||
  deployment.rpcUrl ||
  'https://por.bcy-p.metalhosts.com/cre-alpha/MvqtrdftrbxcP3ZgGBJb3bK5/ethereum/sepolia'

const receiverAddress =
  process.env.ORACLE_COURT_RECEIVER ||
  proofBlock?.receiverAddress ||
  deployment.receiver?.address ||
  deployment.receiver?.contractAddress

const vaultAddress =
  process.env.ORACLE_COURT_VAULT ||
  proofBlock?.vaultAddress ||
  deployment.vault?.address ||
  deployment.vault?.contractAddress

if (!receiverAddress || !vaultAddress) {
  throw new Error('Could not resolve receiver/vault address for proof generation')
}

const client = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl, { timeout: 30_000 }),
})

const receipt = await client.waitForTransactionReceipt({ hash: txHash })

const receiverAbi = parseAbi([
  'function latestMode() view returns (uint8)',
  'function latestRiskScoreBps() view returns (uint16)',
  'function latestProsecutorScore() view returns (uint16)',
  'function latestDefenderScore() view returns (uint16)',
  'function latestAuditorScore() view returns (uint16)',
  'function latestTimestamp() view returns (uint32)',
  'function latestCaseId() view returns (bytes32)',
  'function latestProsecutorEvidenceHash() view returns (bytes32)',
  'function latestDefenderEvidenceHash() view returns (bytes32)',
  'function latestAuditorEvidenceHash() view returns (bytes32)',
  'function latestVerdictDigest() view returns (bytes32)',
])

const vaultAbi = parseAbi([
  'function riskMode() view returns (uint8)',
  'function throttleMintLimit() view returns (uint256)',
  'function reserveCoverageBps() view returns (uint16)',
  'function attestationAgeSeconds() view returns (uint32)',
  'function redemptionQueueBps() view returns (uint16)',
  'function canMint(uint256 amount) view returns (bool)',
  'function canRedeem(uint256 amount) pure returns (bool)',
])

const [
  latestMode,
  latestRiskScoreBps,
  latestProsecutorScore,
  latestDefenderScore,
  latestAuditorScore,
  latestTimestamp,
  latestCaseId,
  latestProsecutorEvidenceHash,
  latestDefenderEvidenceHash,
  latestAuditorEvidenceHash,
  latestVerdictDigest,
  vaultRiskMode,
  vaultThrottleMintLimit,
  vaultReserveCoverageBps,
  vaultAttestationAgeSeconds,
  vaultRedemptionQueueBps,
  vaultCanMint1000,
  vaultCanMint5000,
  vaultCanRedeem1000,
] = await Promise.all([
  client.readContract({ address: receiverAddress, abi: receiverAbi, functionName: 'latestMode' }),
  client.readContract({ address: receiverAddress, abi: receiverAbi, functionName: 'latestRiskScoreBps' }),
  client.readContract({
    address: receiverAddress,
    abi: receiverAbi,
    functionName: 'latestProsecutorScore',
  }),
  client.readContract({
    address: receiverAddress,
    abi: receiverAbi,
    functionName: 'latestDefenderScore',
  }),
  client.readContract({
    address: receiverAddress,
    abi: receiverAbi,
    functionName: 'latestAuditorScore',
  }),
  client.readContract({ address: receiverAddress, abi: receiverAbi, functionName: 'latestTimestamp' }),
  client.readContract({ address: receiverAddress, abi: receiverAbi, functionName: 'latestCaseId' }),
  client.readContract({
    address: receiverAddress,
    abi: receiverAbi,
    functionName: 'latestProsecutorEvidenceHash',
  }),
  client.readContract({
    address: receiverAddress,
    abi: receiverAbi,
    functionName: 'latestDefenderEvidenceHash',
  }),
  client.readContract({
    address: receiverAddress,
    abi: receiverAbi,
    functionName: 'latestAuditorEvidenceHash',
  }),
  client.readContract({
    address: receiverAddress,
    abi: receiverAbi,
    functionName: 'latestVerdictDigest',
  }),
  client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'riskMode' }),
  client.readContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'throttleMintLimit',
  }),
  client.readContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'reserveCoverageBps',
  }),
  client.readContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'attestationAgeSeconds',
  }),
  client.readContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'redemptionQueueBps',
  }),
  client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'canMint', args: [1000n] }),
  client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'canMint', args: [5000n] }),
  client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'canRedeem', args: [1000n] }),
])

const fallbackInputValues = {
  offchain: {
    usdcMedian: sourceSummary?.median ?? prosecutorAgent?.argument?.metrics?.usdcMedian ?? null,
    usdcMin: sourceSummary?.min ?? null,
    usdcMax: sourceSummary?.max ?? null,
    usdc24hChangePct: defenderAgent?.argument?.metrics?.change24hPct ?? null,
    successfulSourceCount: sourceSummary?.successful ?? null,
    failedSourceCount: sourceSummary?.failed ?? null,
    httpCallsUsed: sourceSummary?.httpCallsUsed ?? null,
    httpCallsMax: sourceSummary?.httpCallsMax ?? null,
  },
  onchain: {
    ethUsd: prosecutorAgent?.argument?.metrics?.ethUsd ?? null,
    btcUsd: prosecutorAgent?.argument?.metrics?.btcUsd ?? null,
  },
  rwa: {
    reserveCoverageBps:
      auditorAgent?.argument?.metrics?.reserveCoverageBps ??
      prosecutorAgent?.argument?.metrics?.reserveCoverageBps ??
      null,
    attestationAgeSeconds:
      auditorAgent?.argument?.metrics?.attestationAgeSeconds ??
      prosecutorAgent?.argument?.metrics?.attestationAgeSeconds ??
      null,
    redemptionQueueBps:
      auditorAgent?.argument?.metrics?.redemptionQueueBps ??
      prosecutorAgent?.argument?.metrics?.redemptionQueueBps ??
      null,
  },
}

const deterministicProofBlock = {
  proofVersion: 'oracle-court-v3',
  generatedAtIso: new Date().toISOString(),
  simulationTimestamp,
  txHash,
  blockNumber: receipt.blockNumber.toString(),
  chainId: sepolia.id,
  receiverAddress,
  vaultAddress,
  inputValues: proofBlock?.inputValues || fallbackInputValues,
  agentArguments: {
    prosecutor: prosecutorAgent?.argument || null,
    defender: defenderAgent?.argument || null,
    auditor: auditorAgent?.argument || null,
  },
  agentScores: proofBlock?.agentScores || {
    prosecutorScore: simulationResult?.prosecutorScore ?? null,
    defenderScore: simulationResult?.defenderScore ?? null,
    auditorScore: simulationResult?.auditorScore ?? null,
    riskScoreBps: simulationResult?.riskScoreBps ?? null,
  },
  evidenceHashes: proofBlock?.evidenceHashes || {
    prosecutorEvidenceHash:
      simulationResult?.prosecutorEvidenceHash || prosecutorAgent?.evidenceHash || null,
    defenderEvidenceHash:
      simulationResult?.defenderEvidenceHash || defenderAgent?.evidenceHash || null,
    auditorEvidenceHash: simulationResult?.auditorEvidenceHash || auditorAgent?.evidenceHash || null,
    verdictDigest: simulationResult?.verdictDigest || null,
  },
  finalVerdict: proofBlock?.finalVerdict || {
    mode: simulationResult?.mode ?? null,
    modeLabel: simulationResult?.modeLabel ?? null,
    caseId: simulationResult?.caseId ?? null,
    txHash,
  },
  onchainState: {
    receiver: {
      latestMode: Number(latestMode),
      latestRiskScoreBps: Number(latestRiskScoreBps),
      latestProsecutorScore: Number(latestProsecutorScore),
      latestDefenderScore: Number(latestDefenderScore),
      latestAuditorScore: Number(latestAuditorScore),
      latestTimestamp: Number(latestTimestamp),
      latestCaseId,
      latestProsecutorEvidenceHash,
      latestDefenderEvidenceHash,
      latestAuditorEvidenceHash,
      latestVerdictDigest,
    },
    vault: {
      riskMode: Number(vaultRiskMode),
      throttleMintLimit: vaultThrottleMintLimit.toString(),
      reserveCoverageBps: Number(vaultReserveCoverageBps),
      attestationAgeSeconds: Number(vaultAttestationAgeSeconds),
      redemptionQueueBps: Number(vaultRedemptionQueueBps),
      canMint1000: Boolean(vaultCanMint1000),
      canMint5000: Boolean(vaultCanMint5000),
      canRedeem1000: Boolean(vaultCanRedeem1000),
    },
  },
}

const markdown = `# Oracle Court Proof Artifact\n\n## Deterministic Proof Block\n\n\`\`\`json\n${JSON.stringify(deterministicProofBlock, null, 2)}\n\`\`\`\n\n## Notes\n\n- Receiver enforces protocol consequence by calling \`MockRWAVault.setRiskMode(mode)\` from each accepted tribunal report.\n- Risk mode policy on the vault:\n  - \`NORMAL\` => mint + redeem allowed\n  - \`THROTTLE\` => mint limited by \`throttleMintLimit\`\n  - \`REDEMPTION_ONLY\` => mint disabled, redeem allowed\n- Source execution details are logged in \`artifacts/oracle-court-sim-latest.log\`.\n- RWA telemetry inputs (reserve coverage, attestation age, redemption queue pressure) are included in \`inputValues.rwa\` and reflected in tribunal arguments.\n`

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, markdown, 'utf8')
console.log(`Oracle Court proof artifact written: ${outputPath}`)
