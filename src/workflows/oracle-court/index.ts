import {
  bytesToHex,
  ConsensusAggregationByFields,
  CronCapability,
  EVMClient,
  encodeCallMsg,
  getNetwork,
  handler,
  hexToBase64,
  LAST_FINALIZED_BLOCK_NUMBER,
  Runner,
  TxStatus,
  median,
  cre,
  type HTTPSendRequester,
  type Runtime,
} from '@chainlink/cre-sdk'
import {
  type Address,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
  parseAbiParameters,
  zeroAddress,
} from 'viem'
import { z } from 'zod'

import { AGGREGATOR_V3_ABI } from './aggregator-v3-abi'

const configSchema = z.object({
  schedule: z.string(),
  chainSelectorName: z.string(),
  receiverAddress: z.string(),
  gasLimit: z.string(),
  apis: z.object({
    coingeckoUrl: z.string(),
    coinbaseUrl: z.string(),
    cryptocompareUrl: z.string(),
  }),
  feeds: z.object({
    ethUsdProxy: z.string(),
    btcUsdProxy: z.string(),
  }),
  policy: z.object({
    normalMaxStressBps: z.number().int().nonnegative(),
    throttleMaxStressBps: z.number().int().nonnegative(),
  }),
})

type Config = z.infer<typeof configSchema>

type TribunalMode = 0 | 1 | 2

interface OffchainSignals {
  usdcCg: number
  usdcCb: number
  usdcCc: number
  usdc24hChangePct: number
}

interface OnchainSignals {
  ethUsd: number
  btcUsd: number
}

interface TribunalVerdict {
  mode: TribunalMode
  stressBps: number
  depegBps: number
  spreadBps: number
  prosecutorScore: number
  defenderScore: number
  auditorScore: number
  timestamp: number
  caseId: `0x${string}`
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const safeJsonStringify = (value: unknown): string =>
  JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2)

const parseJsonBody = <T>(body: Uint8Array | string): T => {
  const text = Buffer.from(body).toString('utf-8')
  return JSON.parse(text) as T
}

const assertFiniteNumber = (name: string, value: number): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric value for ${name}: ${value}`)
  }
  return value
}

const httpGetJson = <T>(sendRequester: HTTPSendRequester, url: string): T => {
  const response = sendRequester
    .sendRequest({
      url,
      method: 'GET',
    })
    .result()

  if (response.statusCode !== 200) {
    throw new Error(`HTTP GET failed (${response.statusCode}) for ${url}`)
  }

  return parseJsonBody<T>(response.body)
}

type CoinGeckoResponse = {
  'usd-coin'?: {
    usd?: number
    usd_24h_change?: number
  }
}

type CoinbaseSpotResponse = {
  data?: {
    amount?: string
  }
}

type CryptoCompareResponse = {
  USD?: number
}

const fetchOffchainSignals = (
  sendRequester: HTTPSendRequester,
  config: Config,
): OffchainSignals => {
  const coinGecko = httpGetJson<CoinGeckoResponse>(sendRequester, config.apis.coingeckoUrl)
  const coinbase = httpGetJson<CoinbaseSpotResponse>(sendRequester, config.apis.coinbaseUrl)
  const cryptoCompare = httpGetJson<CryptoCompareResponse>(sendRequester, config.apis.cryptocompareUrl)

  const usdcCg = assertFiniteNumber('usdcCg', Number(coinGecko['usd-coin']?.usd))
  const usdcCb = assertFiniteNumber('usdcCb', Number(coinbase.data?.amount))
  const usdcCc = assertFiniteNumber('usdcCc', Number(cryptoCompare.USD))
  const usdc24hChangePct = assertFiniteNumber(
    'usdc24hChangePct',
    Number(coinGecko['usd-coin']?.usd_24h_change ?? 0),
  )

  return {
    usdcCg,
    usdcCb,
    usdcCc,
    usdc24hChangePct,
  }
}

const readFeedPrice = (
  runtime: Runtime<Config>,
  evmClient: EVMClient,
  proxyAddress: string,
): number => {
  const decimalsCall = encodeFunctionData({
    abi: AGGREGATOR_V3_ABI,
    functionName: 'decimals',
  })

  const decimalsResponse = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: proxyAddress as Address,
        data: decimalsCall,
      }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result()

  const decimals = Number(
    decodeFunctionResult({
      abi: AGGREGATOR_V3_ABI,
      functionName: 'decimals',
      data: bytesToHex(decimalsResponse.data),
    }),
  )

  const latestRoundDataCall = encodeFunctionData({
    abi: AGGREGATOR_V3_ABI,
    functionName: 'latestRoundData',
  })

  const latestRoundDataResponse = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: proxyAddress as Address,
        data: latestRoundDataCall,
      }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result()

  const decoded = decodeFunctionResult({
    abi: AGGREGATOR_V3_ABI,
    functionName: 'latestRoundData',
    data: bytesToHex(latestRoundDataResponse.data),
  }) as readonly [bigint, bigint, bigint, bigint, bigint]

  const answer = Number(decoded[1]) / 10 ** decimals
  return assertFiniteNumber(`price(${proxyAddress})`, answer)
}

const runTribunal = (
  config: Config,
  offchain: OffchainSignals,
  onchain: OnchainSignals,
  timestamp: number,
): TribunalVerdict => {
  const prices = [offchain.usdcCg, offchain.usdcCb, offchain.usdcCc]
  const avgPeg = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const minPeg = Math.min(...prices)
  const maxPeg = Math.max(...prices)

  const depegBps = clamp(Math.round(Math.abs(avgPeg - 1) * 10_000), 0, 10_000)
  const spreadBps = clamp(Math.round((maxPeg - minPeg) * 10_000), 0, 10_000)
  const downside24hBps = clamp(Math.round(Math.max(0, -offchain.usdc24hChangePct) * 100), 0, 10_000)

  const macroStress =
    (onchain.ethUsd < 2000 ? 25 : 0) +
    (onchain.btcUsd < 40_000 ? 25 : 0) +
    clamp(Math.round(Math.max(0, 1 - offchain.usdcCg) * 10_000 * 0.25), 0, 1_000)

  const prosecutorScore = clamp(
    Math.round(depegBps * 4 + spreadBps * 2 + downside24hBps + macroStress),
    0,
    65_535,
  )

  const defenderScore = clamp(
    Math.round(Math.max(0, 80 - depegBps) * 3 + Math.max(0, 40 - spreadBps) * 2),
    0,
    65_535,
  )

  const auditorScore = clamp(
    (spreadBps > 10 ? 120 : 0) +
      (depegBps > 50 ? 180 : 0) +
      (prices.some((price) => price < 0.985 || price > 1.015) ? 300 : 0),
    0,
    65_535,
  )

  const stressBps = clamp(Math.round(prosecutorScore - defenderScore + auditorScore), 0, 10_000)

  let mode: TribunalMode = 0
  if (stressBps <= config.policy.normalMaxStressBps) {
    mode = 0
  } else if (stressBps <= config.policy.throttleMaxStressBps) {
    mode = 1
  } else {
    mode = 2
  }

  const caseId = keccak256(
    encodeAbiParameters(
      parseAbiParameters(
        'uint32 timestamp, uint16 depegBps, uint16 spreadBps, uint16 prosecutorScore, uint16 defenderScore, uint16 auditorScore, uint16 stressBps',
      ),
      [
        timestamp,
        depegBps,
        spreadBps,
        prosecutorScore,
        defenderScore,
        auditorScore,
        stressBps,
      ],
    ),
  )

  return {
    mode,
    stressBps,
    depegBps,
    spreadBps,
    prosecutorScore,
    defenderScore,
    auditorScore,
    timestamp,
    caseId,
  }
}

const writeVerdictOnchain = (
  runtime: Runtime<Config>,
  evmClient: EVMClient,
  verdict: TribunalVerdict,
): string => {
  const encodedVerdict = encodeAbiParameters(
    parseAbiParameters('uint8 mode, uint16 stressBps, uint32 timestamp, bytes32 caseId'),
    [verdict.mode, verdict.stressBps, verdict.timestamp, verdict.caseId],
  )

  const report = runtime
    .report({
      encodedPayload: hexToBase64(encodedVerdict),
      encoderName: 'evm',
      signingAlgo: 'ecdsa',
      hashingAlgo: 'keccak256',
    })
    .result()

  const writeResult = evmClient
    .writeReport(runtime, {
      receiver: runtime.config.receiverAddress,
      report,
      gasConfig: {
        gasLimit: runtime.config.gasLimit,
      },
    })
    .result()

  if (writeResult.txStatus !== TxStatus.SUCCESS) {
    throw new Error(
      `Write report failed with status=${writeResult.txStatus} error=${writeResult.errorMessage || 'unknown'}`,
    )
  }

  return bytesToHex(writeResult.txHash || new Uint8Array(32))
}

const onCronTrigger = (runtime: Runtime<Config>) => {
  const network = getNetwork({
    chainFamily: 'evm',
    chainSelectorName: runtime.config.chainSelectorName,
    isTestnet: true,
  })

  if (!network) {
    throw new Error(`Network not found for ${runtime.config.chainSelectorName}`)
  }

  const evmClient = new EVMClient(network.chainSelector.selector)
  const httpClient = new cre.capabilities.HTTPClient()

  const offchainSignals = httpClient
    .sendRequest(
      runtime,
      fetchOffchainSignals,
      ConsensusAggregationByFields<OffchainSignals>({
        usdcCg: median,
        usdcCb: median,
        usdcCc: median,
        usdc24hChangePct: median,
      }),
    )(runtime.config)
    .result()

  const onchainSignals: OnchainSignals = {
    ethUsd: readFeedPrice(runtime, evmClient, runtime.config.feeds.ethUsdProxy),
    btcUsd: readFeedPrice(runtime, evmClient, runtime.config.feeds.btcUsdProxy),
  }

  const timestamp = Math.floor(runtime.now().getTime() / 1000)
  const verdict = runTribunal(runtime.config, offchainSignals, onchainSignals, timestamp)

  runtime.log(`[OracleCourt] Offchain signals: ${safeJsonStringify(offchainSignals)}`)
  runtime.log(`[OracleCourt] Onchain signals: ${safeJsonStringify(onchainSignals)}`)
  runtime.log(
    `[OracleCourt] Tribunal scores prosecutor=${verdict.prosecutorScore} defender=${verdict.defenderScore} auditor=${verdict.auditorScore}`,
  )
  runtime.log(
    `[OracleCourt] Verdict mode=${verdict.mode} stressBps=${verdict.stressBps} depegBps=${verdict.depegBps} spreadBps=${verdict.spreadBps} caseId=${verdict.caseId}`,
  )

  const txHash = writeVerdictOnchain(runtime, evmClient, verdict)
  runtime.log(`[OracleCourt] Write report transaction succeeded: ${txHash}`)

  return {
    mode: verdict.mode,
    stressBps: verdict.stressBps,
    depegBps: verdict.depegBps,
    spreadBps: verdict.spreadBps,
    caseId: verdict.caseId,
    txHash,
  }
}

const initWorkflow = (config: Config) => {
  const cron = new CronCapability()
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)]
}

export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema })
  await runner.run(initWorkflow)
}
