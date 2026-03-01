import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import solc from 'solc'
import { createPublicClient, createWalletClient, formatEther, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const PRIVATE_KEY = process.env.CRE_ETH_PRIVATE_KEY
if (!PRIVATE_KEY) {
  throw new Error('Missing CRE_ETH_PRIVATE_KEY in environment')
}

const rpcUrl =
  process.env.SEPOLIA_RPC_URL ||
  'https://por.bcy-p.metalhosts.com/cre-alpha/MvqtrdftrbxcP3ZgGBJb3bK5/ethereum/sepolia'

const projectRoot = process.cwd()
const sourcePath = path.join(projectRoot, 'contracts', 'OracleCourtReceiver.sol')
const source = fs.readFileSync(sourcePath, 'utf8')

const compilerInput = {
  language: 'Solidity',
  sources: {
    'OracleCourtReceiver.sol': {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
  },
}

const compilerOutput = JSON.parse(solc.compile(JSON.stringify(compilerInput)))

if (compilerOutput.errors?.length) {
  const fatal = compilerOutput.errors.filter((e) => e.severity === 'error')
  const formatted = compilerOutput.errors.map((e) => e.formattedMessage).join('\n')
  if (fatal.length) {
    throw new Error(`Solidity compilation failed:\n${formatted}`)
  }
  console.warn(formatted)
}

const contract = compilerOutput.contracts?.['OracleCourtReceiver.sol']?.['OracleCourtReceiver']
if (!contract) {
  throw new Error('Compiled contract artifact not found for OracleCourtReceiver')
}

const abi = contract.abi
const bytecode = `0x${contract.evm.bytecode.object}`

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

console.log('Deploying OracleCourtReceiver...')
const txHash = await walletClient.deployContract({
  abi,
  bytecode,
  account,
})
console.log(`Deploy tx: ${txHash}`)

const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
if (!receipt.contractAddress) {
  throw new Error('Deployment receipt missing contractAddress')
}

const deployment = {
  network: 'ethereum-testnet-sepolia',
  chainId: sepolia.id,
  contractName: 'OracleCourtReceiver',
  contractAddress: receipt.contractAddress,
  deployTxHash: txHash,
  blockNumber: receipt.blockNumber.toString(),
  rpcUrl,
  deployedAt: new Date().toISOString(),
  deployer: account.address,
  abi,
}

const outDir = path.join(projectRoot, 'contracts', 'deployments')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'sepolia-oracle-court-receiver.json')
fs.writeFileSync(outPath, `${JSON.stringify(deployment, null, 2)}\n`, 'utf8')

console.log(`Contract deployed at: ${receipt.contractAddress}`)
console.log(`Deployment receipt saved: ${outPath}`)
