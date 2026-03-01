import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { createPublicClient, http, parseAbi } from 'viem'
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

const parseTaggedJson = (tag) => {
  const line = lines.find((entry) => entry.includes(tag))
  if (!line) return null
  const index = line.indexOf(tag)
  if (index < 0) return null
  return tryParseJson(line.slice(index + tag.length))
}

const parseTaggedJsonMany = (tag) =>
  lines
    .filter((entry) => entry.includes(tag))
    .map((entry) => {
      const index = entry.indexOf(tag)
      if (index < 0) return null
      return tryParseJson(entry.slice(index + tag.length))
    })
    .filter(Boolean)

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
    policyExplanation: proofBlock?.policySimulation?.explanation || null,
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
  generatedAtIso: new Date().toISOString(),
  txHash,
  blockNumber: receipt?.blockNumber?.toString() || null,
  chainId: sepolia.id,
  receiverAddress,
  vaultAddress,
  inputValues: proofBlock?.inputValues || null,
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

const dossier = evidenceDossier || null
const briefs = parsedBriefs

const dossierMarkdown = `# Evidence Dossier\n\n## Canonical Evidence Root\n\n- evidenceRoot: \`${parsedEvidenceHashes.evidenceRoot || 'n/a'}\`\n- admissibilityScoreBps: \`${dossier?.admissibilityScoreBps ?? 'n/a'}\`\n- evidenceFreshnessScoreBps: \`${dossier?.evidenceFreshnessScoreBps ?? 'n/a'}\`\n- protectedSourcesPresent: \`${dossier?.protectedSourcesPresent ?? 'n/a'}\`\n\n## Claims\n\n\`\`\`json\n${JSON.stringify(dossier?.claims || [], null, 2)}\n\`\`\`\n\n## Contradiction Matrix\n\n\`\`\`json\n${JSON.stringify(dossier?.contradictionMatrix || [], null, 2)}\n\`\`\`\n`

const briefsMarkdown = `# Tribunal Briefs\n\n## Prosecutor\n\n\`\`\`json\n${JSON.stringify(briefs.prosecutor || null, null, 2)}\n\`\`\`\n\n## Defender\n\n\`\`\`json\n${JSON.stringify(briefs.defender || null, null, 2)}\n\`\`\`\n\n## Auditor\n\n\`\`\`json\n${JSON.stringify(briefs.auditor || null, null, 2)}\n\`\`\`\n\n## Evidence Hashes\n\n- prosecutorEvidenceHash: \`${parsedEvidenceHashes.prosecutorEvidenceHash || 'n/a'}\`\n- defenderEvidenceHash: \`${parsedEvidenceHashes.defenderEvidenceHash || 'n/a'}\`\n- auditorEvidenceHash: \`${parsedEvidenceHashes.auditorEvidenceHash || 'n/a'}\`\n`

const policyMarkdown = `# Policy Simulation\n\n## Counterfactual Mode Analysis\n\n\`\`\`json\n${JSON.stringify(deterministicProofBlock.policySimulation, null, 2)}\n\`\`\`\n\n## Final Selection\n\n- selectedMode: \`${finalVerdict.modeLabel || 'n/a'}\`\n- rationale: ${finalVerdict.reason || 'n/a'}\n`

const proofMarkdown = `# Oracle Court Proof Artifact\n\n## Deterministic Proof Block\n\n\`\`\`json\n${JSON.stringify(deterministicProofBlock, null, 2)}\n\`\`\`\n\n## Notes\n\n- Evidence dossier is compiled before tribunal reasoning and hashed as \`evidenceRoot\`.\n- Prosecutor / Defender / Auditor briefs are adversarial, citation-backed, and independently hashed.\n- Policy mode is selected via counterfactual simulation across NORMAL / THROTTLE / REDEMPTION_ONLY.\n- Receiver enforces protocol consequence by calling \`MockRWAVault.setRiskMode(mode)\`.\n`

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
