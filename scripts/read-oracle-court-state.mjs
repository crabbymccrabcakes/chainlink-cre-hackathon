import process from 'node:process'
import { createPublicClient, http, parseAbi } from 'viem'
import { sepolia } from 'viem/chains'

const rpcUrl =
  process.env.SEPOLIA_RPC_URL ||
  'https://por.bcy-p.metalhosts.com/cre-alpha/MvqtrdftrbxcP3ZgGBJb3bK5/ethereum/sepolia'

const address =
  process.env.ORACLE_COURT_RECEIVER ||
  '0xed32426e3315cb1acf830f801cf1de6b52be959e'

const abi = parseAbi([
  'function latestMode() view returns (uint8)',
  'function latestStressBps() view returns (uint16)',
  'function latestTimestamp() view returns (uint32)',
  'function latestCaseId() view returns (bytes32)',
])

const client = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl, { timeout: 30_000 }),
})

const [mode, stressBps, timestamp, caseId] = await Promise.all([
  client.readContract({ address, abi, functionName: 'latestMode' }),
  client.readContract({ address, abi, functionName: 'latestStressBps' }),
  client.readContract({ address, abi, functionName: 'latestTimestamp' }),
  client.readContract({ address, abi, functionName: 'latestCaseId' }),
])

console.log(
  JSON.stringify(
    {
      receiver: address,
      mode: Number(mode),
      stressBps: Number(stressBps),
      timestamp: Number(timestamp),
      caseId,
    },
    null,
    2,
  ),
)
