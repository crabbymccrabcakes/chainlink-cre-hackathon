import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { createPublicClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const projectRoot = process.cwd()

const deploymentPath = path.join(
  projectRoot,
  'contracts',
  'deployments',
  'sepolia-oracle-court-stack.json',
)

const deployment = fs.existsSync(deploymentPath)
  ? JSON.parse(fs.readFileSync(deploymentPath, 'utf8'))
  : {}

const rpcUrl =
  process.env.SEPOLIA_RPC_URL ||
  deployment.rpcUrl ||
  'https://por.bcy-p.metalhosts.com/cre-alpha/MvqtrdftrbxcP3ZgGBJb3bK5/ethereum/sepolia'

const receiverAddress =
  process.env.ORACLE_COURT_RECEIVER || deployment.receiver?.address || deployment.receiver?.contractAddress

const vaultAddress =
  process.env.ORACLE_COURT_VAULT || deployment.vault?.address || deployment.vault?.contractAddress

if (!receiverAddress || !vaultAddress) {
  throw new Error(
    'Could not resolve receiver/vault addresses. Deploy stack first or set ORACLE_COURT_RECEIVER and ORACLE_COURT_VAULT.',
  )
}

const receiverAbi = parseAbi([
  'function hasCase(bytes32 caseId) view returns (bool)',
  'function getCaseSummary(bytes32 caseId) view returns ((bool exists,uint8 mode,uint8 appealOutcome,uint16 riskScoreBps,uint16 prosecutorScore,uint16 defenderScore,uint16 auditorScore,uint16 contradictionCount,uint16 contradictionSeverityBps,uint16 evidenceFreshnessScoreBps,uint16 admissibilityScoreBps,uint32 timestamp,bytes32 caseId,bytes32 priorCaseId,bytes32 appealOfCaseId,bytes32 prosecutorEvidenceHash,bytes32 defenderEvidenceHash,bytes32 auditorEvidenceHash,bytes32 verdictDigest))',
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
  'function latestPriorCaseId() view returns (bytes32)',
  'function latestAppealOfCaseId() view returns (bytes32)',
  'function latestAppealOutcome() view returns (uint8)',
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

const client = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl, { timeout: 30_000 }),
})

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
  latestPriorCaseId,
  latestAppealOfCaseId,
  latestAppealOutcome,
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
  totalMinted,
  totalRedeemed,
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
  client.readContract({ address: receiverAddress, abi: receiverAbi, functionName: 'latestPriorCaseId' }),
  client.readContract({
    address: receiverAddress,
    abi: receiverAbi,
    functionName: 'latestAppealOfCaseId',
  }),
  client.readContract({ address: receiverAddress, abi: receiverAbi, functionName: 'latestAppealOutcome' }),
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

const latestCaseSummary = await client.readContract({
  address: receiverAddress,
  abi: receiverAbi,
  functionName: 'getCaseSummary',
  args: [latestCaseId],
})

console.log(
  JSON.stringify(
    {
      receiverAddress,
      vaultAddress,
      receiverState: {
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
        latestPriorCaseId,
        latestAppealOfCaseId,
        latestAppealOutcome: Number(latestAppealOutcome),
        latestProsecutorEvidenceHash,
        latestDefenderEvidenceHash,
        latestAuditorEvidenceHash,
        latestVerdictDigest,
        latestCaseSummary: {
          exists: latestCaseSummary.exists,
          mode: Number(latestCaseSummary.mode),
          appealOutcome: Number(latestCaseSummary.appealOutcome),
          riskScoreBps: Number(latestCaseSummary.riskScoreBps),
          prosecutorScore: Number(latestCaseSummary.prosecutorScore),
          defenderScore: Number(latestCaseSummary.defenderScore),
          auditorScore: Number(latestCaseSummary.auditorScore),
          contradictionCount: Number(latestCaseSummary.contradictionCount),
          contradictionSeverityBps: Number(latestCaseSummary.contradictionSeverityBps),
          evidenceFreshnessScoreBps: Number(latestCaseSummary.evidenceFreshnessScoreBps),
          admissibilityScoreBps: Number(latestCaseSummary.admissibilityScoreBps),
          timestamp: Number(latestCaseSummary.timestamp),
          caseId: latestCaseSummary.caseId,
          priorCaseId: latestCaseSummary.priorCaseId,
          appealOfCaseId: latestCaseSummary.appealOfCaseId,
          prosecutorEvidenceHash: latestCaseSummary.prosecutorEvidenceHash,
          defenderEvidenceHash: latestCaseSummary.defenderEvidenceHash,
          auditorEvidenceHash: latestCaseSummary.auditorEvidenceHash,
          verdictDigest: latestCaseSummary.verdictDigest,
        },
      },
      vaultState: {
        riskMode: Number(vaultRiskMode),
        throttleMintLimit: vaultThrottleMintLimit.toString(),
        reserveCoverageBps: Number(vaultReserveCoverageBps),
        attestationAgeSeconds: Number(vaultAttestationAgeSeconds),
        redemptionQueueBps: Number(vaultRedemptionQueueBps),
        canMint1000: Boolean(vaultCanMint1000),
        canMint5000: Boolean(vaultCanMint5000),
        canRedeem1000: Boolean(vaultCanRedeem1000),
        totalMinted: totalMinted.toString(),
        totalRedeemed: totalRedeemed.toString(),
        actorState: actorAddress
          ? {
              actorAddress,
              balance: actorBalance.toString(),
            }
          : null,
      },
    },
    null,
    2,
  ),
)
