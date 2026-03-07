import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { createPublicClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const projectRoot = process.cwd()

const logPath = path.join(projectRoot, 'artifacts', 'oracle-court-sim-latest.log')
const proofPath = path.join(projectRoot, 'artifacts', 'oracle-court-proof.md')
const dossierJsonPath = path.join(projectRoot, 'artifacts', 'evidence-dossier.json')
const dossierMdPath = path.join(projectRoot, 'artifacts', 'evidence-dossier.md')
const briefsMdPath = path.join(projectRoot, 'artifacts', 'tribunal-briefs.md')
const simulationMdPath = path.join(projectRoot, 'artifacts', 'policy-simulation.md')
const bulletinJsonPath = path.join(projectRoot, 'artifacts', 'verdict-bulletin.json')
const deploymentPath = path.join(projectRoot, 'contracts', 'deployments', 'sepolia-oracle-court-stack.json')
const workflowConfigPath = path.join(projectRoot, 'src', 'workflows', 'oracle-court', 'config.generated.json')

if (!fs.existsSync(logPath)) {
  throw new Error(`Simulation log not found: ${logPath}`)
}

const deployment = fs.existsSync(deploymentPath)
  ? JSON.parse(fs.readFileSync(deploymentPath, 'utf8'))
  : {}
const workflowConfig = fs.existsSync(workflowConfigPath)
  ? JSON.parse(fs.readFileSync(workflowConfigPath, 'utf8'))
  : null

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

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const parseJsonFromLinePrefix = (prefix, startIndex) => {
  const line = lines[startIndex]
  const prefixIndex = line.indexOf(prefix)
  if (prefixIndex < 0) return null

  const payload = line.slice(prefixIndex + prefix.length).trim()
  if (!payload || payload.includes('...(truncated)')) return null

  const direct = tryParseJson(payload)
  if (direct !== null) return direct

  if (!payload.startsWith('{') && !payload.startsWith('[')) {
    return null
  }

  const collected = [payload]
  let objectDepth = (payload.match(/\{/g) || []).length - (payload.match(/\}/g) || []).length
  let arrayDepth = (payload.match(/\[/g) || []).length - (payload.match(/\]/g) || []).length

  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const next = lines[i]
    if (next.includes('...(truncated)')) return null
    collected.push(next)
    objectDepth += (next.match(/\{/g) || []).length - (next.match(/\}/g) || []).length
    arrayDepth += (next.match(/\[/g) || []).length - (next.match(/\]/g) || []).length

    if (objectDepth <= 0 && arrayDepth <= 0) {
      return tryParseJson(collected.join('\n'))
    }
  }

  return null
}

const parseTaggedJson = (tag) => {
  const index = lines.findIndex((entry) => entry.includes(tag))
  if (index < 0) return null
  return parseJsonFromLinePrefix(tag, index)
}

const parseTaggedJsonMany = (tag) =>
  lines
    .map((entry, index) => (entry.includes(tag) ? parseJsonFromLinePrefix(tag, index) : null))
    .filter(Boolean)

const parsePrefixedJson = (prefix) => {
  const index = lines.findIndex((entry) => entry.includes(prefix))
  if (index < 0) return null
  return parseJsonFromLinePrefix(prefix, index)
}

const parseSourceSummary = () => {
  const line = lines.find((entry) => entry.includes('[OracleCourt][SourceSummary]'))
  if (!line) return null

  const match = line.match(
    /successful=(\d+)\s+failed=(\d+)\s+median=([0-9.]+)\s+min=([0-9.]+)\s+max=([0-9.]+)/,
  )
  if (!match) return null

  return {
    successfulSources: Number(match[1]),
    failedSources: Number(match[2]),
    usdcMedian: Number(match[3]),
    usdcMin: Number(match[4]),
    usdcMax: Number(match[5]),
  }
}

const parseOffchainChange24hPct = () => {
  const startIndex = lines.findIndex((entry) => entry.includes('[OracleCourt] Offchain signals:'))
  if (startIndex < 0) return null

  const endIndex = lines.findIndex(
    (entry, index) => index > startIndex && entry.includes('[OracleCourt] Onchain signals:'),
  )

  const slice = lines.slice(startIndex, endIndex === -1 ? undefined : endIndex).join('\n')
  const match = slice.match(/"change24hPct":\s*(-?\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : null
}

const buildFallbackInputValues = () => {
  const sourceSummary = parseSourceSummary()
  const onchainSignals = parsePrefixedJson('[OracleCourt] Onchain signals: ')
  const rwaSignals = parsePrefixedJson('[OracleCourt] RWA signals: ')

  if (!sourceSummary || !onchainSignals || !rwaSignals || !workflowConfig?.rwaPolicy) {
    return null
  }

  const usdc24hChangePct = parseOffchainChange24hPct()
  const reserveCoverageGapBps = clamp(
    workflowConfig.rwaPolicy.minReserveCoverageBps - rwaSignals.reserveCoverageBps,
    0,
    10_000,
  )
  const attestationLagSeconds = clamp(
    rwaSignals.attestationAgeSeconds - workflowConfig.rwaPolicy.maxAttestationAgeSeconds,
    0,
    10_000_000,
  )
  const redemptionQueueExcessBps = clamp(
    rwaSignals.redemptionQueueBps - workflowConfig.rwaPolicy.maxRedemptionQueueBps,
    0,
    10_000,
  )

  return {
    usdcMedian: sourceSummary.usdcMedian,
    usdcMin: sourceSummary.usdcMin,
    usdcMax: sourceSummary.usdcMax,
    usdc24hChangePct,
    ethUsd: onchainSignals.ethUsd,
    btcUsd: onchainSignals.btcUsd,
    reserveCoverageBps: rwaSignals.reserveCoverageBps,
    attestationAgeSeconds: rwaSignals.attestationAgeSeconds,
    redemptionQueueBps: rwaSignals.redemptionQueueBps,
    depegBps: clamp(Math.round(Math.abs(sourceSummary.usdcMedian - 1) * 10_000), 0, 10_000),
    spreadBps: clamp(Math.round((sourceSummary.usdcMax - sourceSummary.usdcMin) * 10_000), 0, 10_000),
    downside24hBps:
      usdc24hChangePct === null ? null : clamp(Math.round(Math.max(0, -usdc24hChangePct) * 100), 0, 10_000),
    reserveCoverageGapBps,
    attestationLagPenaltyBps: clamp(Math.round(attestationLagSeconds / 120), 0, 2_500),
    redemptionQueuePenaltyBps: clamp(Math.round(redemptionQueueExcessBps * 1.5), 0, 3_000),
    sourceFailurePenaltyBps: clamp(sourceSummary.failedSources * 45, 0, 1_000),
    macroStressBps:
      (onchainSignals.ethUsd < 2_000 ? 35 : 0) +
      (onchainSignals.btcUsd < 40_000 ? 35 : 0) +
      (sourceSummary.successfulSources < workflowConfig.offchain.sources.length ? 25 : 0),
  }
}

const parseSimulationResult = () => {
  const index = lines.findIndex((line) => line.includes('✓ Workflow Simulation Result:'))
  if (index < 0) return null

  const jsonLines = []
  let depth = 0
  let started = false

  for (let i = index + 1; i < lines.length; i += 1) {
    const line = lines[i]

    if (!started && line.startsWith('{')) started = true
    if (!started) continue

    jsonLines.push(line)
    depth += (line.match(/\{/g) || []).length
    depth -= (line.match(/\}/g) || []).length

    if (depth === 0) break
  }

  return jsonLines.length > 0 ? tryParseJson(jsonLines.join('\n')) : null
}

let txHash = null
for (const line of lines) {
  const txHashMatch = line.match(/Write report transaction succeeded:\s*(0x[a-fA-F0-9]{64})/)
  if (txHashMatch) txHash = txHashMatch[1]
}

const simulationResult = parseSimulationResult()
if (!txHash && simulationResult?.txHash) txHash = simulationResult.txHash
if (!txHash) {
  throw new Error('Could not find transaction hash in simulation logs')
}

const proofBlock = parseTaggedJson('[OracleCourt][ProofBlock] ')
const evidenceDossierSummary = parseTaggedJson('[OracleCourt][EvidenceDossier] ')
const dossierClaims = parseTaggedJsonMany('[OracleCourt][DossierClaim] ')
const contradictionMatrix = parseTaggedJson('[OracleCourt][ContradictionMatrix] ')
const prosecutorBriefBlob = parseTaggedJson('[OracleCourt][AgentBrief][PROSECUTOR] ')
const defenderBriefBlob = parseTaggedJson('[OracleCourt][AgentBrief][DEFENDER] ')
const auditorBriefBlob = parseTaggedJson('[OracleCourt][AgentBrief][AUDITOR] ')
const policySimulation = parseTaggedJson('[OracleCourt][PolicySimulation] ')
const constitutionalAssessments = parseTaggedJson('[OracleCourt][Constitution] ')
const appealOutcome = parseTaggedJson('[OracleCourt][AppealOutcome] ')
const fallbackInputValues = buildFallbackInputValues()

const evidenceDossier = evidenceDossierSummary
  ? {
      ...evidenceDossierSummary,
      claims: dossierClaims,
      contradictionMatrix: contradictionMatrix || [],
    }
  : null

if (!proofBlock && !simulationResult) {
  throw new Error('Could not parse proof data from logs')
}

const verdictBulletin =
  parseTaggedJson('[OracleCourt][VerdictBulletin] ') ||
  {
    caseId: proofBlock?.finalVerdict?.caseId || simulationResult?.caseId || null,
    mode: proofBlock?.finalVerdict?.modeLabel || simulationResult?.modeLabel || null,
    riskScoreBps: proofBlock?.agentScores?.riskScoreBps || simulationResult?.riskScoreBps || null,
    evidenceRoot: proofBlock?.evidenceHashes?.evidenceRoot || simulationResult?.evidenceRoot || null,
    verdictDigest: proofBlock?.evidenceHashes?.verdictDigest || simulationResult?.verdictDigest || null,
    policyExplanation: proofBlock?.policySimulation?.explanation || policySimulation?.explanation || null,
    constitutionalAssessments: constitutionalAssessments || [],
    appealOutcome: appealOutcome || null,
    txHash,
  }

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

const isPlaceholderTxHash = /^0x0{64}$/i.test(txHash)
const receipt = isPlaceholderTxHash
  ? null
  : await client.waitForTransactionReceipt({ hash: txHash })

const receiverAbi = parseAbi([
  'function latestMode() view returns (uint8)',
  'function latestRiskScoreBps() view returns (uint16)',
  'function latestProsecutorScore() view returns (uint16)',
  'function latestDefenderScore() view returns (uint16)',
  'function latestAuditorScore() view returns (uint16)',
  'function latestContradictionCount() view returns (uint16)',
  'function latestContradictionSeverityBps() view returns (uint16)',
  'function latestEvidenceFreshnessScoreBps() view returns (uint16)',
  'function latestAdmissibilityScoreBps() view returns (uint16)',
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
  'function balances(address) view returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'function totalRedeemed() view returns (uint256)',
])

const actorAddress = process.env.CRE_ETH_PRIVATE_KEY
  ? privateKeyToAccount(process.env.CRE_ETH_PRIVATE_KEY as `0x${string}`).address
  : null

const [
  latestMode,
  latestRiskScoreBps,
  latestProsecutorScore,
  latestDefenderScore,
  latestAuditorScore,
  latestContradictionCount,
  latestContradictionSeverityBps,
  latestEvidenceFreshnessScoreBps,
  latestAdmissibilityScoreBps,
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
  actorBalance,
  vaultTotalMinted,
  vaultTotalRedeemed,
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
  client.readContract({
    address: receiverAddress,
    abi: receiverAbi,
    functionName: 'latestContradictionCount',
  }),
  client.readContract({
    address: receiverAddress,
    abi: receiverAbi,
    functionName: 'latestContradictionSeverityBps',
  }),
  client.readContract({
    address: receiverAddress,
    abi: receiverAbi,
    functionName: 'latestEvidenceFreshnessScoreBps',
  }),
  client.readContract({
    address: receiverAddress,
    abi: receiverAbi,
    functionName: 'latestAdmissibilityScoreBps',
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
  actorAddress
    ? client.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: 'balances',
        args: [actorAddress],
      })
    : Promise.resolve(0n),
  client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'totalMinted' }),
  client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'totalRedeemed' }),
])

const parsedBriefs = {
  prosecutor: prosecutorBriefBlob?.brief || proofBlock?.agentBriefs?.prosecutor || null,
  defender: defenderBriefBlob?.brief || proofBlock?.agentBriefs?.defender || null,
  auditor: auditorBriefBlob?.brief || proofBlock?.agentBriefs?.auditor || null,
}

const parsedEvidenceHashes = {
  evidenceRoot:
    proofBlock?.evidenceHashes?.evidenceRoot || simulationResult?.evidenceRoot || verdictBulletin?.evidenceRoot || null,
  prosecutorEvidenceHash:
    prosecutorBriefBlob?.evidenceHash || proofBlock?.evidenceHashes?.prosecutorEvidenceHash || simulationResult?.prosecutorEvidenceHash || null,
  defenderEvidenceHash:
    defenderBriefBlob?.evidenceHash || proofBlock?.evidenceHashes?.defenderEvidenceHash || simulationResult?.defenderEvidenceHash || null,
  auditorEvidenceHash:
    auditorBriefBlob?.evidenceHash || proofBlock?.evidenceHashes?.auditorEvidenceHash || simulationResult?.auditorEvidenceHash || null,
  verdictDigest:
    proofBlock?.evidenceHashes?.verdictDigest || simulationResult?.verdictDigest || verdictBulletin?.verdictDigest || null,
}

const finalVerdict = {
  mode: proofBlock?.finalVerdict?.mode ?? simulationResult?.mode ?? null,
  modeLabel: proofBlock?.finalVerdict?.modeLabel ?? simulationResult?.modeLabel ?? null,
  policyMode: proofBlock?.finalVerdict?.policyMode ?? simulationResult?.policyMode ?? null,
  policyModeLabel:
    proofBlock?.finalVerdict?.policyModeLabel ?? simulationResult?.policyModeLabel ?? null,
  caseId: proofBlock?.finalVerdict?.caseId ?? simulationResult?.caseId ?? null,
  txHash,
  reason:
    proofBlock?.policySimulation?.explanation ||
    verdictBulletin?.policyExplanation ||
    policySimulation?.explanation ||
    null,
}

const deterministicProofBlock = {
  proofVersion: 'oracle-court-ai-governor-v1',
  proofMode: isPlaceholderTxHash ? 'simulated-placeholder' : 'onchain-broadcast',
  generatedAtIso: new Date().toISOString(),
  txHash,
  blockNumber: receipt?.blockNumber?.toString() || null,
  chainId: sepolia.id,
  receiverAddress,
  vaultAddress,
  inputValues: proofBlock?.inputValues || fallbackInputValues || null,
  evidenceDossierSummary: proofBlock?.evidenceDossierSummary || evidenceDossierSummary || null,
  evidenceDossier,
  agentBriefs: parsedBriefs,
  agentScores: proofBlock?.agentScores || {
    prosecutorScore: simulationResult?.prosecutorScore ?? null,
    defenderScore: simulationResult?.defenderScore ?? null,
    auditorScore: simulationResult?.auditorScore ?? null,
    riskScoreBps: simulationResult?.riskScoreBps ?? null,
  },
  policySimulation: policySimulation || proofBlock?.policySimulation || null,
  constitutionalAssessments: constitutionalAssessments || proofBlock?.constitutionalAssessments || [],
  appealOutcome: appealOutcome || proofBlock?.appealOutcome || null,
  evidenceHashes: parsedEvidenceHashes,
  finalVerdict,
  verdictBulletin,
  onchainState: {
    receiver: {
      latestMode: Number(latestMode),
      latestRiskScoreBps: Number(latestRiskScoreBps),
      latestProsecutorScore: Number(latestProsecutorScore),
      latestDefenderScore: Number(latestDefenderScore),
      latestAuditorScore: Number(latestAuditorScore),
      latestContradictionCount: Number(latestContradictionCount),
      latestContradictionSeverityBps: Number(latestContradictionSeverityBps),
      latestEvidenceFreshnessScoreBps: Number(latestEvidenceFreshnessScoreBps),
      latestAdmissibilityScoreBps: Number(latestAdmissibilityScoreBps),
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
      totalMinted: vaultTotalMinted.toString(),
      totalRedeemed: vaultTotalRedeemed.toString(),
      actorState: actorAddress
        ? {
            actorAddress,
            balance: actorBalance.toString(),
          }
        : null,
    },
  },
}

const dossier = evidenceDossier || null
const briefs = parsedBriefs

const dossierMarkdown = `# Evidence Dossier\n\n## Canonical Evidence Root\n\n- evidenceRoot: \`${parsedEvidenceHashes.evidenceRoot || 'n/a'}\`\n- admissibilityScoreBps: \`${dossier?.admissibilityScoreBps ?? 'n/a'}\`\n- evidenceFreshnessScoreBps: \`${dossier?.evidenceFreshnessScoreBps ?? 'n/a'}\`\n- protectedSourcesPresent: \`${dossier?.protectedSourcesPresent ?? 'n/a'}\`\n\n## Claims\n\n\`\`\`json\n${JSON.stringify(dossier?.claims || [], null, 2)}\n\`\`\`\n\n## Contradiction Matrix\n\n\`\`\`json\n${JSON.stringify(dossier?.contradictionMatrix || [], null, 2)}\n\`\`\`\n`

const briefsMarkdown = `# Tribunal Briefs\n\n## Prosecutor\n\n\`\`\`json\n${JSON.stringify(briefs.prosecutor || null, null, 2)}\n\`\`\`\n\n## Defender\n\n\`\`\`json\n${JSON.stringify(briefs.defender || null, null, 2)}\n\`\`\`\n\n## Auditor\n\n\`\`\`json\n${JSON.stringify(briefs.auditor || null, null, 2)}\n\`\`\`\n\n## Evidence Hashes\n\n- prosecutorEvidenceHash: \`${parsedEvidenceHashes.prosecutorEvidenceHash || 'n/a'}\`\n- defenderEvidenceHash: \`${parsedEvidenceHashes.defenderEvidenceHash || 'n/a'}\`\n- auditorEvidenceHash: \`${parsedEvidenceHashes.auditorEvidenceHash || 'n/a'}\`\n`

const policyMarkdown = `# Policy Simulation\n\n## Counterfactual Mode Analysis\n\n\`\`\`json\n${JSON.stringify(deterministicProofBlock.policySimulation, null, 2)}\n\`\`\`\n\n## Final Selection\n\n- selectedMode: \`${finalVerdict.modeLabel || 'n/a'}\`\n- rationale: ${finalVerdict.reason || 'n/a'}\n`

const proofMarkdown = `# Oracle Court Proof Artifact\n\n## Deterministic Proof Block\n\n\`\`\`json\n${JSON.stringify(deterministicProofBlock, null, 2)}\n\`\`\`\n\n## Notes\n\n- Evidence dossier is compiled before tribunal reasoning and hashed as \`evidenceRoot\`.\n- Prosecutor / Defender / Auditor briefs are adversarial, citation-backed, and independently hashed.\n- Policy mode is selected via counterfactual simulation across NORMAL / THROTTLE / REDEMPTION_ONLY.\n- Receiver enforces protocol consequence by calling \`MockRWAVault.setRiskMode(mode)\`.\n- If \`proofMode=simulated-placeholder\`, treat artifact as simulation-only (not final onchain proof).\n`

fs.mkdirSync(path.dirname(proofPath), { recursive: true })
fs.writeFileSync(proofPath, proofMarkdown, 'utf8')
fs.writeFileSync(dossierJsonPath, `${JSON.stringify(dossier || {}, null, 2)}\n`, 'utf8')
fs.writeFileSync(dossierMdPath, dossierMarkdown, 'utf8')
fs.writeFileSync(briefsMdPath, briefsMarkdown, 'utf8')
fs.writeFileSync(simulationMdPath, policyMarkdown, 'utf8')
fs.writeFileSync(bulletinJsonPath, `${JSON.stringify(verdictBulletin, null, 2)}\n`, 'utf8')

console.log(`Oracle Court proof artifact written: ${proofPath}`)
console.log(`Evidence dossier JSON written: ${dossierJsonPath}`)
console.log(`Evidence dossier markdown written: ${dossierMdPath}`)
console.log(`Tribunal briefs markdown written: ${briefsMdPath}`)
console.log(`Policy simulation markdown written: ${simulationMdPath}`)
console.log(`Verdict bulletin JSON written: ${bulletinJsonPath}`)
