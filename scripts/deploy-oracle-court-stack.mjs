import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import solc from 'solc'
import { createPublicClient, createWalletClient, formatEther, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

import { syncOracleCourtConfig } from './sync-oracle-court-config.mjs'

const PRIVATE_KEY = process.env.CRE_ETH_PRIVATE_KEY
if (!PRIVATE_KEY) {
  throw new Error('Missing CRE_ETH_PRIVATE_KEY in environment')
}

const rpcUrl =
  process.env.SEPOLIA_RPC_URL ||
  'https://por.bcy-p.metalhosts.com/cre-alpha/MvqtrdftrbxcP3ZgGBJb3bK5/ethereum/sepolia'

const throttleMintLimit = BigInt(process.env.ORACLE_COURT_THROTTLE_MINT_LIMIT || '1000')
const initialReserveCoverageBps = Number(process.env.ORACLE_COURT_INITIAL_RESERVE_COVERAGE_BPS || '10000')
const initialAttestationAgeSeconds = Number(process.env.ORACLE_COURT_INITIAL_ATTESTATION_AGE_SECONDS || '300')
const initialRedemptionQueueBps = Number(process.env.ORACLE_COURT_INITIAL_REDEMPTION_QUEUE_BPS || '200')
const projectRoot = process.cwd()

const sourceFiles = {
  'OracleCourtReceiver.sol': path.join(projectRoot, 'contracts', 'OracleCourtReceiver.sol'),
  'MockRWAVault.sol': path.join(projectRoot, 'contracts', 'MockRWAVault.sol'),
}

const compilerInput = {
  language: 'Solidity',
  sources: Object.fromEntries(
    Object.entries(sourceFiles).map(([name, filePath]) => [
      name,
      {
        content: fs.readFileSync(filePath, 'utf8'),
      },
    ]),
  ),
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    viaIR: true,
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
  },
}

const compilerOutput = JSON.parse(solc.compile(JSON.stringify(compilerInput)))

if (compilerOutput.errors?.length) {
  const fatalErrors = compilerOutput.errors.filter((entry) => entry.severity === 'error')
  const formattedErrors = compilerOutput.errors.map((entry) => entry.formattedMessage).join('\n')

  if (fatalErrors.length > 0) {
    throw new Error(`Solidity compilation failed:\n${formattedErrors}`)
  }

  console.warn(formattedErrors)
}

const vaultArtifact = compilerOutput.contracts?.['MockRWAVault.sol']?.['MockRWAVault']
const receiverArtifact = compilerOutput.contracts?.['OracleCourtReceiver.sol']?.['OracleCourtReceiver']

if (!vaultArtifact) throw new Error('Compiled MockRWAVault artifact not found')
if (!receiverArtifact) throw new Error('Compiled OracleCourtReceiver artifact not found')

const vaultAbi = vaultArtifact.abi
const vaultBytecode = `0x${vaultArtifact.evm.bytecode.object}`

const receiverAbi = receiverArtifact.abi
const receiverBytecode = `0x${receiverArtifact.evm.bytecode.object}`

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

const balance = await publicClient.getBalance({ address: account.address })
console.log(`Deployer: ${account.address}`)
console.log(`Balance: ${formatEther(balance)} ETH`)

if (balance === 0n) {
  throw new Error('Deployer has zero ETH on Sepolia; fund wallet before deploying')
}

console.log(
  `Deploying MockRWAVault (throttleMintLimit=${throttleMintLimit}, reserveCoverageBps=${initialReserveCoverageBps}, attestationAgeSeconds=${initialAttestationAgeSeconds}, redemptionQueueBps=${initialRedemptionQueueBps})...`,
)
const vaultDeployTx = await walletClient.deployContract({
  abi: vaultAbi,
  bytecode: vaultBytecode,
  account,
  args: [
    account.address,
    throttleMintLimit,
    initialReserveCoverageBps,
    initialAttestationAgeSeconds,
    initialRedemptionQueueBps,
  ],
})
console.log(`MockRWAVault deploy tx: ${vaultDeployTx}`)

const vaultReceipt = await publicClient.waitForTransactionReceipt({ hash: vaultDeployTx })
if (!vaultReceipt.contractAddress) {
  throw new Error('MockRWAVault deployment receipt missing contractAddress')
}

const vaultAddress = vaultReceipt.contractAddress
console.log(`MockRWAVault deployed at: ${vaultAddress}`)

console.log('Deploying OracleCourtReceiver...')
const receiverDeployTx = await walletClient.deployContract({
  abi: receiverAbi,
  bytecode: receiverBytecode,
  account,
  args: [vaultAddress],
})
console.log(`OracleCourtReceiver deploy tx: ${receiverDeployTx}`)

const receiverReceipt = await publicClient.waitForTransactionReceipt({ hash: receiverDeployTx })
if (!receiverReceipt.contractAddress) {
  throw new Error('OracleCourtReceiver deployment receipt missing contractAddress')
}

const receiverAddress = receiverReceipt.contractAddress
console.log(`OracleCourtReceiver deployed at: ${receiverAddress}`)

console.log('Wiring vault court role to OracleCourtReceiver...')
const setCourtTx = await walletClient.writeContract({
  address: vaultAddress,
  abi: vaultAbi,
  functionName: 'setCourt',
  args: [receiverAddress],
  account,
})
console.log(`setCourt tx: ${setCourtTx}`)

const setCourtReceipt = await publicClient.waitForTransactionReceipt({ hash: setCourtTx })

const deployment = {
  network: 'ethereum-testnet-sepolia',
  chainId: sepolia.id,
  rpcUrl,
  deployedAt: new Date().toISOString(),
  deployer: account.address,
  stackVersion: 'oracle-court-v3',
  vault: {
    contractName: 'MockRWAVault',
    address: vaultAddress,
    deployTxHash: vaultDeployTx,
    deployBlockNumber: vaultReceipt.blockNumber.toString(),
    throttleMintLimit: throttleMintLimit.toString(),
    reserveCoverageBps: initialReserveCoverageBps,
    attestationAgeSeconds: initialAttestationAgeSeconds,
    redemptionQueueBps: initialRedemptionQueueBps,
  },
  receiver: {
    contractName: 'OracleCourtReceiver',
    address: receiverAddress,
    deployTxHash: receiverDeployTx,
    deployBlockNumber: receiverReceipt.blockNumber.toString(),
  },
  wiring: {
    setCourtTxHash: setCourtTx,
    setCourtBlockNumber: setCourtReceipt.blockNumber.toString(),
  },
  abi: {
    mockRWAVault: vaultAbi,
    oracleCourtReceiver: receiverAbi,
  },
}

const deploymentDir = path.join(projectRoot, 'contracts', 'deployments')
fs.mkdirSync(deploymentDir, { recursive: true })

const stackDeploymentFile = path.join(deploymentDir, 'sepolia-oracle-court-stack.json')
fs.writeFileSync(stackDeploymentFile, `${JSON.stringify(deployment, null, 2)}\n`, 'utf8')

console.log(`Stack deployment saved: ${stackDeploymentFile}`)

const syncResult = syncOracleCourtConfig({ projectRoot })
console.log(`Config synced: ${syncResult.generatedFile}`)
console.log(`receiverAddress=${syncResult.receiverAddress}`)
console.log(`vaultAddress=${syncResult.vaultAddress}`)
