import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const PRIVATE_KEY = process.env.CRE_ETH_PRIVATE_KEY
if (!PRIVATE_KEY) {
  throw new Error('Missing CRE_ETH_PRIVATE_KEY in environment')
}

const projectRoot = process.cwd()
const deploymentPath = path.join(
  projectRoot,
  'contracts',
  'deployments',
  'sepolia-oracle-court-stack.json',
)

if (!fs.existsSync(deploymentPath)) {
  throw new Error(`Deployment file not found: ${deploymentPath}. Run bun run deploy:oracle-court:stack first.`)
}

const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'))

const rpcUrl =
  process.env.SEPOLIA_RPC_URL ||
  deployment.rpcUrl ||
  'https://por.bcy-p.metalhosts.com/cre-alpha/MvqtrdftrbxcP3ZgGBJb3bK5/ethereum/sepolia'

const vaultAddress = process.env.ORACLE_COURT_VAULT || deployment.vault?.address
if (!vaultAddress) {
  throw new Error('Could not resolve vault address from deployment or ORACLE_COURT_VAULT env var')
}

const reserveCoverageBps = Number(process.env.ORACLE_COURT_RESERVE_COVERAGE_BPS || '10000')
const attestationAgeSeconds = Number(process.env.ORACLE_COURT_ATTESTATION_AGE_SECONDS || '300')
const redemptionQueueBps = Number(process.env.ORACLE_COURT_REDEMPTION_QUEUE_BPS || '200')

if (!Number.isInteger(reserveCoverageBps) || reserveCoverageBps < 0 || reserveCoverageBps > 20000) {
  throw new Error('ORACLE_COURT_RESERVE_COVERAGE_BPS must be an integer between 0 and 20000')
}
if (!Number.isInteger(attestationAgeSeconds) || attestationAgeSeconds < 0) {
  throw new Error('ORACLE_COURT_ATTESTATION_AGE_SECONDS must be a non-negative integer')
}
if (!Number.isInteger(redemptionQueueBps) || redemptionQueueBps < 0 || redemptionQueueBps > 10000) {
  throw new Error('ORACLE_COURT_REDEMPTION_QUEUE_BPS must be an integer between 0 and 10000')
}

const vaultAbi = parseAbi([
  'function setRiskTelemetry(uint16,uint32,uint16) external',
  'function reserveCoverageBps() view returns (uint16)',
  'function attestationAgeSeconds() view returns (uint32)',
  'function redemptionQueueBps() view returns (uint16)',
])

const account = privateKeyToAccount(PRIVATE_KEY)
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl, { timeout: 30_000 }),
})
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(rpcUrl, { timeout: 30_000 }),
})

console.log(
  `Setting RWA telemetry on ${vaultAddress}: reserveCoverageBps=${reserveCoverageBps}, attestationAgeSeconds=${attestationAgeSeconds}, redemptionQueueBps=${redemptionQueueBps}`,
)

const txHash = await walletClient.writeContract({
  address: vaultAddress,
  abi: vaultAbi,
  functionName: 'setRiskTelemetry',
  args: [reserveCoverageBps, attestationAgeSeconds, redemptionQueueBps],
  account,
})

const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

const [finalReserveCoverageBps, finalAttestationAgeSeconds, finalRedemptionQueueBps] = await Promise.all([
  publicClient.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'reserveCoverageBps' }),
  publicClient.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'attestationAgeSeconds' }),
  publicClient.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'redemptionQueueBps' }),
])

console.log(
  JSON.stringify(
    {
      txHash,
      blockNumber: receipt.blockNumber.toString(),
      vaultAddress,
      rwaTelemetry: {
        reserveCoverageBps: Number(finalReserveCoverageBps),
        attestationAgeSeconds: Number(finalAttestationAgeSeconds),
        redemptionQueueBps: Number(finalRedemptionQueueBps),
      },
    },
    null,
    2,
  ),
)
