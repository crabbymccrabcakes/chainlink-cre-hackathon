import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const deploymentPath = path.join(
  process.cwd(),
  'contracts',
  'deployments',
  'sepolia-oracle-court-stack.json',
)

const deployment = fs.existsSync(deploymentPath)
  ? JSON.parse(fs.readFileSync(deploymentPath, 'utf8'))
  : {}

const resolveRpcUrl = (): string =>
  process.env.SEPOLIA_RPC_URL ||
  deployment.rpcUrl ||
  'https://por.bcy-p.metalhosts.com/cre-alpha/MvqtrdftrbxcP3ZgGBJb3bK5/ethereum/sepolia'

const resolveVaultAddress = (): `0x${string}` => {
  const vaultAddress =
    process.env.ORACLE_COURT_VAULT || deployment.vault?.address || deployment.vault?.contractAddress

  if (!vaultAddress) {
    throw new Error(
      'Could not resolve vault address. Deploy stack first or set ORACLE_COURT_VAULT.',
    )
  }

  return vaultAddress
}

const vaultReadAbi = parseAbi([
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

const vaultWriteAbi = parseAbi([
  'function mint(uint256 amount)',
  'function redeem(uint256 amount)',
])

export type VaultActionKind = 'mint' | 'redeem'
export type VaultActionExpectedStatus = 'SUCCESS' | 'REVERTED'

const DEFAULT_REVERT_PROOF_GAS = 150_000n

export interface VaultActionPlanItem {
  label: string
  kind: VaultActionKind
  amount: bigint
  expectedStatus?: VaultActionExpectedStatus
  gas?: bigint
}

export interface VaultExecutionState {
  riskMode: number
  throttleMintLimit: string
  reserveCoverageBps: number
  attestationAgeSeconds: number
  redemptionQueueBps: number
  canMintAmount: boolean
  canRedeemAmount: boolean
  actorBalance: string
  totalMinted: string
  totalRedeemed: string
}

export interface VaultActionOutcome {
  label: string
  kind: VaultActionKind
  amount: string
  expectedStatus: VaultActionExpectedStatus
  status: 'SUCCESS' | 'REVERTED' | 'BLOCKED'
  txHash: string | null
  blockNumber: string | null
  error: string | null
  actorBalanceDelta: string
  totalMintedDelta: string
  totalRedeemedDelta: string
  before: VaultExecutionState
  after: VaultExecutionState
}

export interface VaultActionPlanResult {
  actorAddress: `0x${string}`
  vaultAddress: `0x${string}`
  outcomes: VaultActionOutcome[]
  finalState: VaultExecutionState
}

const compactError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message.replace(/\s+/g, ' ').trim().slice(0, 280)
  }

  return String(error).replace(/\s+/g, ' ').trim().slice(0, 280)
}

const formatDelta = (before: string, after: string): string => (BigInt(after) - BigInt(before)).toString()

const readExecutionState = async (
  client: ReturnType<typeof createPublicClient>,
  vaultAddress: `0x${string}`,
  actorAddress: `0x${string}`,
  amount: bigint,
): Promise<VaultExecutionState> => {
  const [
    riskMode,
    throttleMintLimit,
    reserveCoverageBps,
    attestationAgeSeconds,
    redemptionQueueBps,
    canMintAmount,
    canRedeemAmount,
    actorBalance,
    totalMinted,
    totalRedeemed,
  ] = await Promise.all([
    client.readContract({ address: vaultAddress, abi: vaultReadAbi, functionName: 'riskMode' }),
    client.readContract({
      address: vaultAddress,
      abi: vaultReadAbi,
      functionName: 'throttleMintLimit',
    }),
    client.readContract({
      address: vaultAddress,
      abi: vaultReadAbi,
      functionName: 'reserveCoverageBps',
    }),
    client.readContract({
      address: vaultAddress,
      abi: vaultReadAbi,
      functionName: 'attestationAgeSeconds',
    }),
    client.readContract({
      address: vaultAddress,
      abi: vaultReadAbi,
      functionName: 'redemptionQueueBps',
    }),
    client.readContract({
      address: vaultAddress,
      abi: vaultReadAbi,
      functionName: 'canMint',
      args: [amount],
    }),
    client.readContract({
      address: vaultAddress,
      abi: vaultReadAbi,
      functionName: 'canRedeem',
      args: [amount],
    }),
    client.readContract({
      address: vaultAddress,
      abi: vaultReadAbi,
      functionName: 'balances',
      args: [actorAddress],
    }),
    client.readContract({
      address: vaultAddress,
      abi: vaultReadAbi,
      functionName: 'totalMinted',
    }),
    client.readContract({
      address: vaultAddress,
      abi: vaultReadAbi,
      functionName: 'totalRedeemed',
    }),
  ])

  return {
    riskMode: Number(riskMode),
    throttleMintLimit: throttleMintLimit.toString(),
    reserveCoverageBps: Number(reserveCoverageBps),
    attestationAgeSeconds: Number(attestationAgeSeconds),
    redemptionQueueBps: Number(redemptionQueueBps),
    canMintAmount: Boolean(canMintAmount),
    canRedeemAmount: Boolean(canRedeemAmount),
    actorBalance: actorBalance.toString(),
    totalMinted: totalMinted.toString(),
    totalRedeemed: totalRedeemed.toString(),
  }
}

export const executeVaultActionPlan = async (
  plan: VaultActionPlanItem[],
): Promise<VaultActionPlanResult> => {
  const privateKey = process.env.CRE_ETH_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('Missing CRE_ETH_PRIVATE_KEY in environment')
  }

  const rpcUrl = resolveRpcUrl()
  const vaultAddress = resolveVaultAddress()
  const account = privateKeyToAccount(privateKey as `0x${string}`)

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl, { timeout: 30_000 }),
  })

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl, { timeout: 30_000 }),
  })

  const outcomes: VaultActionOutcome[] = []

  for (const action of plan) {
    const expectedStatus = action.expectedStatus || 'SUCCESS'
    const before = await readExecutionState(publicClient, vaultAddress, account.address, action.amount)
    let txHash: `0x${string}` | null = null

    try {
      txHash = await walletClient.writeContract({
        address: vaultAddress,
        abi: vaultWriteAbi,
        functionName: action.kind,
        args: [action.amount],
        account,
        gas: action.gas ?? (expectedStatus === 'REVERTED' ? DEFAULT_REVERT_PROOF_GAS : undefined),
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      const after = await readExecutionState(publicClient, vaultAddress, account.address, action.amount)
      const status = receipt.status === 'reverted' ? 'REVERTED' : 'SUCCESS'

      const outcome: VaultActionOutcome = {
        label: action.label,
        kind: action.kind,
        amount: action.amount.toString(),
        expectedStatus,
        status,
        txHash,
        blockNumber: receipt.blockNumber.toString(),
        error: status === 'REVERTED' ? 'Transaction reverted onchain' : null,
        actorBalanceDelta: formatDelta(before.actorBalance, after.actorBalance),
        totalMintedDelta: formatDelta(before.totalMinted, after.totalMinted),
        totalRedeemedDelta: formatDelta(before.totalRedeemed, after.totalRedeemed),
        before,
        after,
      }

      outcomes.push(outcome)

      if (status !== expectedStatus) {
        throw new Error(`[${action.label}] expected ${expectedStatus} but observed ${status}`)
      }
    } catch (error) {
      const after = await readExecutionState(publicClient, vaultAddress, account.address, action.amount)
      const outcome: VaultActionOutcome = {
        label: action.label,
        kind: action.kind,
        amount: action.amount.toString(),
        expectedStatus,
        status: 'BLOCKED',
        txHash,
        blockNumber: null,
        error: compactError(error),
        actorBalanceDelta: formatDelta(before.actorBalance, after.actorBalance),
        totalMintedDelta: formatDelta(before.totalMinted, after.totalMinted),
        totalRedeemedDelta: formatDelta(before.totalRedeemed, after.totalRedeemed),
        before,
        after,
      }

      outcomes.push(outcome)
      throw error
    }
  }

  return {
    actorAddress: account.address,
    vaultAddress,
    outcomes,
    finalState: await readExecutionState(publicClient, vaultAddress, account.address, 1000n),
  }
}

if (import.meta.main) {
  const actionSpec = process.env.ORACLE_COURT_ACTIONS_JSON
  if (!actionSpec) {
    throw new Error('Missing ORACLE_COURT_ACTIONS_JSON in environment')
  }

  const parsed = JSON.parse(actionSpec) as Array<{
    label: string
    kind: VaultActionKind
    amount: string | number
    expectedStatus?: VaultActionExpectedStatus
    gas?: string | number
  }>

  const plan: VaultActionPlanItem[] = parsed.map((action) => ({
    label: action.label,
    kind: action.kind,
    amount: BigInt(action.amount),
    expectedStatus: action.expectedStatus,
    gas: action.gas === undefined ? undefined : BigInt(action.gas),
  }))

  const result = await executeVaultActionPlan(plan)
  console.log(JSON.stringify(result, null, 2))
}
