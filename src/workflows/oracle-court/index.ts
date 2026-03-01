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
  median,
  Runner,
  TxStatus,
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
  parseAbi,
  parseAbiParameters,
  stringToHex,
  zeroAddress,
} from 'viem'
import { z } from 'zod'

import { AGGREGATOR_V3_ABI } from './aggregator-v3-abi'

const sourceKindSchema = z.enum(['coingecko', 'coinbaseSpot', 'coinbaseTicker', 'coinpaprika', 'cryptocompare'])

const RWA_VAULT_ABI = parseAbi([
  'function reserveCoverageBps() view returns (uint16)',
  'function attestationAgeSeconds() view returns (uint32)',
  'function redemptionQueueBps() view returns (uint16)',
])

const configSchema = z.object({
  schedule: z.string(),
  chainSelectorName: z.string(),
  receiverAddress: z.string(),
  vaultAddress: z.string(),
  gasLimit: z.string(),
  feeds: z.object({
    ethUsdProxy: z.string(),
    btcUsdProxy: z.string(),
  }),
  offchain: z.object({
    maxAttempts: z.number().int().min(1).max(5),
    maxHttpCalls: z.number().int().min(1).max(20),
    minSuccessfulSources: z.number().int().min(1),
    sources: z
      .array(
        z.object({
          name: z.string(),
          kind: sourceKindSchema,
          urls: z.array(z.string()).min(1),
        }),
      )
      .min(2),
  }),
  policy: z.object({
    normalMaxRiskBps: z.number().int().nonnegative(),
    throttleMaxRiskBps: z.number().int().nonnegative(),
  }),
  rwaPolicy: z.object({
    minReserveCoverageBps: z.number().int().nonnegative(),
    maxAttestationAgeSeconds: z.number().int().nonnegative(),
    maxRedemptionQueueBps: z.number().int().nonnegative(),
  }),
})

type Config = z.infer<typeof configSchema>
type SourceKind = z.infer<typeof sourceKindSchema>

type TribunalMode = 0 | 1 | 2
type AgentName = 'PROSECUTOR' | 'DEFENDER' | 'AUDITOR'
type ModeLabel = 'NORMAL' | 'THROTTLE' | 'REDEMPTION_ONLY'

interface OnchainSignals {
  ethUsd: number
  btcUsd: number
}

interface RWASignals {
  reserveCoverageBps: number
  attestationAgeSeconds: number
  redemptionQueueBps: number
}

interface SourceObservation {
  name: string
  kind: SourceKind
  selectedUrl: string
  attempt: number
  price: number
  change24hPct: number
}

interface OffchainSignals {
  successfulSources: SourceObservation[]
  failedSources: Array<{ name: string; reason: string }>
  usdcMedian: number
  usdcMin: number
  usdcMax: number
  usdc24hChangePct: number
}

interface AgentArgument {
  agent: AgentName
  claim: string
  metrics: Record<string, number | string>
  recommendation: ModeLabel
  confidenceBps: number
  riskDeltaBps: number
}

interface TribunalVerdict {
  mode: TribunalMode
  modeLabel: ModeLabel
  riskScoreBps: number
  prosecutorScore: number
  defenderScore: number
  auditorScore: number
  depegBps: number
  spreadBps: number
  downside24hBps: number
  reserveCoverageGapBps: number
  attestationLagPenaltyBps: number
  redemptionQueuePenaltyBps: number
  timestamp: number
  caseId: `0x${string}`
  prosecutorEvidenceHash: `0x${string}`
  defenderEvidenceHash: `0x${string}`
  auditorEvidenceHash: `0x${string}`
  verdictDigest: `0x${string}`
  prosecutorArgument: AgentArgument
  defenderArgument: AgentArgument
  auditorArgument: AgentArgument
}

interface SourceReadRequest {
  url: string
  kind: SourceKind
}

interface SourceReadResponse {
  price: number
  change24hPct: number
}

type HttpClientInstance = InstanceType<typeof cre.capabilities.HTTPClient>

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

type CoinbaseTickerResponse = {
  price?: string
}

type CoinPaprikaResponse = {
  quotes?: {
    USD?: {
      price?: number
      percent_change_24h?: number
    }
  }
}

type CryptoCompareResponse = {
  USD?: number
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const round = (value: number, decimals = 8): number => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

const modeToLabel = (mode: TribunalMode): ModeLabel => {
  if (mode === 0) return 'NORMAL'
  if (mode === 1) return 'THROTTLE'
  return 'REDEMPTION_ONLY'
}

const modeFromRisk = (config: Config, riskScoreBps: number): TribunalMode => {
  if (riskScoreBps <= config.policy.normalMaxRiskBps) return 0
  if (riskScoreBps <= config.policy.throttleMaxRiskBps) return 1
  return 2
}

const safeJsonStringify = (value: unknown): string =>
  JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2)

const normalizeForHash = (value: unknown): unknown => {
  if (typeof value === 'number') return round(value, 8)
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value)) return value.map(normalizeForHash)
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {}
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    )

    for (const [key, item] of entries) {
      output[key] = normalizeForHash(item)
    }

    return output
  }

  return value
}

const stableStringify = (value: unknown): string => JSON.stringify(normalizeForHash(value))

const digestObject = <T>(value: T): `0x${string}` => keccak256(stringToHex(stableStringify(value)))

const medianOf = (values: number[]): number => {
  if (values.length === 0) throw new Error('Cannot compute median of an empty array')

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return round((sorted[middle - 1] + sorted[middle]) / 2)
  }

  return round(sorted[middle])
}

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

const truncateText = (value: string, maxLength = 180): string =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`

const parseSourceReading = (kind: SourceKind, body: Uint8Array | string): SourceReadResponse => {
  const payload = parseJsonBody<
    | CoinGeckoResponse
    | CoinbaseSpotResponse
    | CoinbaseTickerResponse
    | CoinPaprikaResponse
    | CryptoCompareResponse
  >(body)

  if (kind === 'coingecko') {
    const coinGeckoPayload = payload as CoinGeckoResponse
    const price = assertFiniteNumber('coingecko.usd', Number(coinGeckoPayload['usd-coin']?.usd))
    const change24hPct = assertFiniteNumber(
      'coingecko.usd_24h_change',
      Number(coinGeckoPayload['usd-coin']?.usd_24h_change ?? 0),
    )

    return {
      price: round(price),
      change24hPct: round(change24hPct),
    }
  }

  if (kind === 'coinbaseSpot') {
    const coinbaseSpotPayload = payload as CoinbaseSpotResponse
    const price = assertFiniteNumber('coinbase.data.amount', Number(coinbaseSpotPayload.data?.amount))
    return {
      price: round(price),
      change24hPct: 0,
    }
  }

  if (kind === 'coinbaseTicker') {
    const coinbaseTickerPayload = payload as CoinbaseTickerResponse
    const price = assertFiniteNumber('coinbaseTicker.price', Number(coinbaseTickerPayload.price))
    return {
      price: round(price),
      change24hPct: 0,
    }
  }

  if (kind === 'coinpaprika') {
    const coinPaprikaPayload = payload as CoinPaprikaResponse
    const price = assertFiniteNumber(
      'coinpaprika.quotes.USD.price',
      Number(coinPaprikaPayload.quotes?.USD?.price),
    )
    const change24hPct = assertFiniteNumber(
      'coinpaprika.quotes.USD.percent_change_24h',
      Number(coinPaprikaPayload.quotes?.USD?.percent_change_24h ?? 0),
    )

    return {
      price: round(price),
      change24hPct: round(change24hPct),
    }
  }

  const cryptoComparePayload = payload as CryptoCompareResponse
  const price = assertFiniteNumber('cryptocompare.USD', Number(cryptoComparePayload.USD))

  return {
    price: round(price),
    change24hPct: 0,
  }
}

const fetchSourceReading = (
  sendRequester: HTTPSendRequester,
  request: SourceReadRequest,
): SourceReadResponse => {
  const response = sendRequester
    .sendRequest({
      url: request.url,
      method: 'GET',
    })
    .result()

  if (response.statusCode !== 200) {
    throw new Error(`HTTP GET failed (${response.statusCode}) for ${request.url}`)
  }

  return parseSourceReading(request.kind, response.body)
}

const fetchSourceWithConsensus = (
  runtime: Runtime<Config>,
  httpClient: HttpClientInstance,
  request: SourceReadRequest,
): SourceReadResponse =>
  httpClient
    .sendRequest(
      runtime,
      fetchSourceReading,
      ConsensusAggregationByFields<SourceReadResponse>({
        price: median,
        change24hPct: median,
      }),
    )(request)
    .result()

const collectOffchainSignals = (
  runtime: Runtime<Config>,
  httpClient: HttpClientInstance,
): OffchainSignals => {
  const successfulSources: SourceObservation[] = []
  const failedSources: Array<{ name: string; reason: string }> = []

  const maxHttpCalls = runtime.config.offchain.maxHttpCalls
  let httpCallCount = 0

  for (let sourceIndex = 0; sourceIndex < runtime.config.offchain.sources.length; sourceIndex += 1) {
    const source = runtime.config.offchain.sources[sourceIndex]

    let resolved: SourceObservation | null = null
    let lastError = 'unknown-error'

    for (let attempt = 1; attempt <= runtime.config.offchain.maxAttempts && !resolved; attempt += 1) {
      for (const url of source.urls) {
        if (httpCallCount >= maxHttpCalls) {
          lastError = `http-call-budget-exhausted(${httpCallCount}/${maxHttpCalls})`
          runtime.log(`[OracleCourt][Source][${source.name}] status=SKIPPED reason=${lastError}`)
          break
        }

        httpCallCount += 1

        try {
          const reading = fetchSourceWithConsensus(runtime, httpClient, {
            url,
            kind: source.kind,
          })

          resolved = {
            name: source.name,
            kind: source.kind,
            selectedUrl: url,
            attempt,
            price: round(reading.price),
            change24hPct: round(reading.change24hPct),
          }

          runtime.log(
            `[OracleCourt][Source][${source.name}] call=${httpCallCount}/${maxHttpCalls} attempt=${attempt} url=${url} status=OK price=${reading.price}`,
          )

          break
        } catch (error) {
          const message = truncateText(error instanceof Error ? error.message : String(error))
          lastError = message

          runtime.log(
            `[OracleCourt][Source][${source.name}] call=${httpCallCount}/${maxHttpCalls} attempt=${attempt} url=${url} status=FAILED reason=${message}`,
          )
        }
      }

      if (resolved) {
        break
      }

      if (httpCallCount >= maxHttpCalls) {
        break
      }

      if (attempt < runtime.config.offchain.maxAttempts) {
        const backoffMs = 250 * 2 ** (attempt - 1)
        runtime.log(
          `[OracleCourt][Source][${source.name}] retryScheduled=true backoffMs=${backoffMs} note=deterministic-no-sleep`,
        )
      }
    }

    if (resolved) {
      successfulSources.push(resolved)
    } else {
      failedSources.push({
        name: source.name,
        reason: truncateText(lastError),
      })

      runtime.log(
        `[OracleCourt][Source][${source.name}] exhausted=true attempts=${runtime.config.offchain.maxAttempts}`,
      )
    }

    if (httpCallCount >= maxHttpCalls && sourceIndex < runtime.config.offchain.sources.length - 1) {
      for (let i = sourceIndex + 1; i < runtime.config.offchain.sources.length; i += 1) {
        const skippedSource = runtime.config.offchain.sources[i]
        const reason = `not-executed-http-call-budget-exhausted(${httpCallCount}/${maxHttpCalls})`

        failedSources.push({
          name: skippedSource.name,
          reason,
        })

        runtime.log(`[OracleCourt][Source][${skippedSource.name}] status=SKIPPED reason=${reason}`)
      }

      break
    }
  }

  if (successfulSources.length < runtime.config.offchain.minSuccessfulSources) {
    throw new Error(
      `Insufficient successful sources: got=${successfulSources.length}, required=${runtime.config.offchain.minSuccessfulSources}`,
    )
  }

  const prices = successfulSources.map((source) => source.price)
  const usdcMedian = medianOf(prices)
  const usdcMin = round(Math.min(...prices))
  const usdcMax = round(Math.max(...prices))

  const coingeckoReading = successfulSources.find((source) => source.kind === 'coingecko')
  const usdc24hChangePct = round(coingeckoReading?.change24hPct ?? 0)

  runtime.log(
    `[OracleCourt][SourceSummary] successful=${successfulSources.length} failed=${failedSources.length} median=${usdcMedian} min=${usdcMin} max=${usdcMax} httpCalls=${httpCallCount}/${maxHttpCalls}`,
  )

  return {
    successfulSources,
    failedSources,
    usdcMedian,
    usdcMin,
    usdcMax,
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
  return round(assertFiniteNumber(`price(${proxyAddress})`, answer), 6)
}

const readRWASignals = (runtime: Runtime<Config>, evmClient: EVMClient): RWASignals => {
  const reserveCoverageCall = encodeFunctionData({
    abi: RWA_VAULT_ABI,
    functionName: 'reserveCoverageBps',
  })
  const reserveCoverageResponse = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: runtime.config.vaultAddress as Address,
        data: reserveCoverageCall,
      }),
    })
    .result()

  const attestationAgeCall = encodeFunctionData({
    abi: RWA_VAULT_ABI,
    functionName: 'attestationAgeSeconds',
  })
  const attestationAgeResponse = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: runtime.config.vaultAddress as Address,
        data: attestationAgeCall,
      }),
    })
    .result()

  const redemptionQueueCall = encodeFunctionData({
    abi: RWA_VAULT_ABI,
    functionName: 'redemptionQueueBps',
  })
  const redemptionQueueResponse = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: runtime.config.vaultAddress as Address,
        data: redemptionQueueCall,
      }),
    })
    .result()

  const reserveCoverageBps = Number(
    decodeFunctionResult({
      abi: RWA_VAULT_ABI,
      functionName: 'reserveCoverageBps',
      data: bytesToHex(reserveCoverageResponse.data),
    }),
  )

  const attestationAgeSeconds = Number(
    decodeFunctionResult({
      abi: RWA_VAULT_ABI,
      functionName: 'attestationAgeSeconds',
      data: bytesToHex(attestationAgeResponse.data),
    }),
  )

  const redemptionQueueBps = Number(
    decodeFunctionResult({
      abi: RWA_VAULT_ABI,
      functionName: 'redemptionQueueBps',
      data: bytesToHex(redemptionQueueResponse.data),
    }),
  )

  return {
    reserveCoverageBps,
    attestationAgeSeconds,
    redemptionQueueBps,
  }
}

const buildTribunalVerdict = (
  config: Config,
  offchain: OffchainSignals,
  onchain: OnchainSignals,
  rwa: RWASignals,
  timestamp: number,
): TribunalVerdict => {
  const depegBps = clamp(Math.round(Math.abs(offchain.usdcMedian - 1) * 10_000), 0, 10_000)
  const spreadBps = clamp(Math.round((offchain.usdcMax - offchain.usdcMin) * 10_000), 0, 10_000)
  const downside24hBps = clamp(Math.round(Math.max(0, -offchain.usdc24hChangePct) * 100), 0, 10_000)

  const sourceFailurePenaltyBps = clamp(offchain.failedSources.length * 45, 0, 1_000)
  const macroStressBps =
    (onchain.ethUsd < 2_000 ? 35 : 0) +
    (onchain.btcUsd < 40_000 ? 35 : 0) +
    (offchain.successfulSources.length < config.offchain.sources.length ? 25 : 0)

  const reserveCoverageGapBps = clamp(
    config.rwaPolicy.minReserveCoverageBps - rwa.reserveCoverageBps,
    0,
    10_000,
  )
  const attestationLagSeconds = clamp(
    rwa.attestationAgeSeconds - config.rwaPolicy.maxAttestationAgeSeconds,
    0,
    10_000_000,
  )
  const redemptionQueueExcessBps = clamp(
    rwa.redemptionQueueBps - config.rwaPolicy.maxRedemptionQueueBps,
    0,
    10_000,
  )

  const attestationLagPenaltyBps = clamp(Math.round(attestationLagSeconds / 120), 0, 2_500)
  const redemptionQueuePenaltyBps = clamp(Math.round(redemptionQueueExcessBps * 1.5), 0, 3_000)

  const prosecutorScore = clamp(
    Math.round(
      depegBps * 4 +
        spreadBps * 2 +
        downside24hBps +
        sourceFailurePenaltyBps +
        macroStressBps +
        reserveCoverageGapBps * 2 +
        attestationLagPenaltyBps +
        redemptionQueuePenaltyBps,
    ),
    0,
    10_000,
  )

  const defenderScore = clamp(
    Math.round(
      Math.max(0, 120 - depegBps) * 2 +
        Math.max(0, 60 - spreadBps) * 2 +
        (offchain.failedSources.length === 0 ? 50 : 0) +
        (reserveCoverageGapBps === 0 ? 45 : 0) +
        (attestationLagPenaltyBps === 0 ? 25 : 0) +
        (redemptionQueuePenaltyBps === 0 ? 25 : 0),
    ),
    0,
    10_000,
  )

  const auditorScore = clamp(
    Math.round(
      spreadBps +
        sourceFailurePenaltyBps +
        (offchain.usdcMedian < 0.995 || offchain.usdcMedian > 1.005 ? 160 : 0) +
        (offchain.failedSources.length > 0 ? 90 : 0) +
        reserveCoverageGapBps +
        attestationLagPenaltyBps +
        redemptionQueuePenaltyBps,
    ),
    0,
    10_000,
  )

  const riskScoreBps = clamp(Math.round(prosecutorScore + auditorScore - defenderScore), 0, 10_000)
  const mode = modeFromRisk(config, riskScoreBps)

  const prosecutorArgument: AgentArgument = {
    agent: 'PROSECUTOR',
    claim:
      prosecutorScore > config.policy.throttleMaxRiskBps
        ? 'Liquidity + reserve stress detected above safe minting threshold'
        : 'Minor stress present; monitor for escalation',
    metrics: {
      usdcMedian: round(offchain.usdcMedian, 6),
      depegBps,
      spreadBps,
      downside24hBps,
      sourceFailures: offchain.failedSources.length,
      reserveCoverageBps: rwa.reserveCoverageBps,
      reserveCoverageGapBps,
      attestationAgeSeconds: rwa.attestationAgeSeconds,
      attestationLagPenaltyBps,
      redemptionQueueBps: rwa.redemptionQueueBps,
      redemptionQueuePenaltyBps,
      ethUsd: round(onchain.ethUsd, 2),
      btcUsd: round(onchain.btcUsd, 2),
    },
    recommendation: modeToLabel(modeFromRisk(config, prosecutorScore)),
    confidenceBps: clamp(5_500 + prosecutorScore * 3, 5_500, 9_900),
    riskDeltaBps: prosecutorScore,
  }

  const defenderArgument: AgentArgument = {
    agent: 'DEFENDER',
    claim:
      defenderScore > 220
        ? 'Observed variance appears bounded; avoid over-restrictive policy'
        : 'Limited mitigation signal available due to uncertainty',
    metrics: {
      usdcMedian: round(offchain.usdcMedian, 6),
      spreadBps,
      successfulSources: offchain.successfulSources.length,
      failedSources: offchain.failedSources.length,
      change24hPct: round(offchain.usdc24hChangePct, 6),
      reserveCoverageBps: rwa.reserveCoverageBps,
      attestationAgeSeconds: rwa.attestationAgeSeconds,
      redemptionQueueBps: rwa.redemptionQueueBps,
    },
    recommendation: modeToLabel(modeFromRisk(config, Math.max(0, prosecutorScore - defenderScore))),
    confidenceBps: clamp(5_000 + defenderScore * 2, 5_000, 9_800),
    riskDeltaBps: -defenderScore,
  }

  const auditorArgument: AgentArgument = {
    agent: 'AUDITOR',
    claim:
      offchain.failedSources.length > 0 ||
      reserveCoverageGapBps > 0 ||
      attestationLagPenaltyBps > 0 ||
      redemptionQueuePenaltyBps > 0
        ? 'Data and/or RWA control signals show elevated operational risk; apply safety premium'
        : 'Data integrity and reserve telemetry checks passed',
    metrics: {
      sourceFailures: offchain.failedSources.length,
      successfulSources: offchain.successfulSources.length,
      spreadBps,
      depegBps,
      macroStressBps,
      sourceFailurePenaltyBps,
      reserveCoverageBps: rwa.reserveCoverageBps,
      reserveCoverageGapBps,
      attestationAgeSeconds: rwa.attestationAgeSeconds,
      attestationLagPenaltyBps,
      redemptionQueueBps: rwa.redemptionQueueBps,
      redemptionQueuePenaltyBps,
    },
    recommendation: modeToLabel(modeFromRisk(config, auditorScore + depegBps)),
    confidenceBps: clamp(5_200 + auditorScore * 3, 5_200, 9_900),
    riskDeltaBps: auditorScore,
  }

  const prosecutorEvidenceHash = digestObject(prosecutorArgument)
  const defenderEvidenceHash = digestObject(defenderArgument)
  const auditorEvidenceHash = digestObject(auditorArgument)

  const caseId = keccak256(
    encodeAbiParameters(
      parseAbiParameters(
        'uint32 timestamp,uint16 depegBps,uint16 spreadBps,uint16 downside24hBps,uint16 reserveCoverageGapBps,uint16 attestationLagPenaltyBps,uint16 redemptionQueuePenaltyBps,uint16 prosecutorScore,uint16 defenderScore,uint16 auditorScore,uint16 riskScoreBps',
      ),
      [
        timestamp,
        depegBps,
        spreadBps,
        downside24hBps,
        reserveCoverageGapBps,
        attestationLagPenaltyBps,
        redemptionQueuePenaltyBps,
        prosecutorScore,
        defenderScore,
        auditorScore,
        riskScoreBps,
      ],
    ),
  )

  const verdictDigest = keccak256(
    encodeAbiParameters(
      parseAbiParameters(
        'bytes32 prosecutorEvidenceHash,bytes32 defenderEvidenceHash,bytes32 auditorEvidenceHash,uint16 riskScoreBps,uint8 mode,uint32 timestamp,bytes32 caseId',
      ),
      [
        prosecutorEvidenceHash,
        defenderEvidenceHash,
        auditorEvidenceHash,
        riskScoreBps,
        mode,
        timestamp,
        caseId,
      ],
    ),
  )

  return {
    mode,
    modeLabel: modeToLabel(mode),
    riskScoreBps,
    prosecutorScore,
    defenderScore,
    auditorScore,
    depegBps,
    spreadBps,
    downside24hBps,
    reserveCoverageGapBps,
    attestationLagPenaltyBps,
    redemptionQueuePenaltyBps,
    timestamp,
    caseId,
    prosecutorEvidenceHash,
    defenderEvidenceHash,
    auditorEvidenceHash,
    verdictDigest,
    prosecutorArgument,
    defenderArgument,
    auditorArgument,
  }
}

const writeVerdictOnchain = (
  runtime: Runtime<Config>,
  evmClient: EVMClient,
  verdict: TribunalVerdict,
): string => {
  const encodedVerdict = encodeAbiParameters(
    parseAbiParameters(
      'uint8 mode,uint16 riskScoreBps,uint16 prosecutorScore,uint16 defenderScore,uint16 auditorScore,uint32 timestamp,bytes32 caseId,bytes32 prosecutorEvidenceHash,bytes32 defenderEvidenceHash,bytes32 auditorEvidenceHash,bytes32 verdictDigest',
    ),
    [
      verdict.mode,
      verdict.riskScoreBps,
      verdict.prosecutorScore,
      verdict.defenderScore,
      verdict.auditorScore,
      verdict.timestamp,
      verdict.caseId,
      verdict.prosecutorEvidenceHash,
      verdict.defenderEvidenceHash,
      verdict.auditorEvidenceHash,
      verdict.verdictDigest,
    ],
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

  const offchainSignals = collectOffchainSignals(runtime, httpClient)
  const onchainSignals: OnchainSignals = {
    ethUsd: readFeedPrice(runtime, evmClient, runtime.config.feeds.ethUsdProxy),
    btcUsd: readFeedPrice(runtime, evmClient, runtime.config.feeds.btcUsdProxy),
  }
  const rwaSignals = readRWASignals(runtime, evmClient)

  const timestamp = Math.floor(runtime.now().getTime() / 1000)
  const verdict = buildTribunalVerdict(runtime.config, offchainSignals, onchainSignals, rwaSignals, timestamp)

  runtime.log(`[OracleCourt] Offchain signals: ${safeJsonStringify(offchainSignals)}`)
  runtime.log(`[OracleCourt] Onchain signals: ${safeJsonStringify(onchainSignals)}`)
  runtime.log(`[OracleCourt] RWA signals: ${safeJsonStringify(rwaSignals)}`)

  runtime.log(
    `[OracleCourt][Agent][PROSECUTOR] argument=${stableStringify(verdict.prosecutorArgument)} evidenceHash=${verdict.prosecutorEvidenceHash}`,
  )
  runtime.log(
    `[OracleCourt][Agent][DEFENDER] argument=${stableStringify(verdict.defenderArgument)} evidenceHash=${verdict.defenderEvidenceHash}`,
  )
  runtime.log(
    `[OracleCourt][Agent][AUDITOR] argument=${stableStringify(verdict.auditorArgument)} evidenceHash=${verdict.auditorEvidenceHash}`,
  )

  runtime.log(
    `[OracleCourt] Tribunal scores prosecutor=${verdict.prosecutorScore} defender=${verdict.defenderScore} auditor=${verdict.auditorScore}`,
  )
  runtime.log(
    `[OracleCourt] Verdict mode=${verdict.mode} (${verdict.modeLabel}) riskScoreBps=${verdict.riskScoreBps} caseId=${verdict.caseId} verdictDigest=${verdict.verdictDigest}`,
  )

  const txHash = writeVerdictOnchain(runtime, evmClient, verdict)
  runtime.log(`[OracleCourt] Write report transaction succeeded: ${txHash}`)

  const proofBlock = {
    timestampUnix: verdict.timestamp,
    timestampIso: new Date(verdict.timestamp * 1000).toISOString(),
    receiverAddress: runtime.config.receiverAddress,
    vaultAddress: runtime.config.vaultAddress,
    inputValues: {
      offchain: {
        usdcMedian: offchainSignals.usdcMedian,
        usdcMin: offchainSignals.usdcMin,
        usdcMax: offchainSignals.usdcMax,
        usdc24hChangePct: offchainSignals.usdc24hChangePct,
        successfulSourceCount: offchainSignals.successfulSources.length,
        failedSourceCount: offchainSignals.failedSources.length,
        successfulSourcePrices: offchainSignals.successfulSources.map((source) => ({
          name: source.name,
          price: source.price,
          attempt: source.attempt,
        })),
      },
      onchain: {
        ethUsd: onchainSignals.ethUsd,
        btcUsd: onchainSignals.btcUsd,
      },
      rwa: {
        reserveCoverageBps: rwaSignals.reserveCoverageBps,
        attestationAgeSeconds: rwaSignals.attestationAgeSeconds,
        redemptionQueueBps: rwaSignals.redemptionQueueBps,
      },
    },
    agentScores: {
      prosecutorScore: verdict.prosecutorScore,
      defenderScore: verdict.defenderScore,
      auditorScore: verdict.auditorScore,
      riskScoreBps: verdict.riskScoreBps,
      depegBps: verdict.depegBps,
      spreadBps: verdict.spreadBps,
      downside24hBps: verdict.downside24hBps,
      reserveCoverageGapBps: verdict.reserveCoverageGapBps,
      attestationLagPenaltyBps: verdict.attestationLagPenaltyBps,
      redemptionQueuePenaltyBps: verdict.redemptionQueuePenaltyBps,
    },
    evidenceHashes: {
      prosecutorEvidenceHash: verdict.prosecutorEvidenceHash,
      defenderEvidenceHash: verdict.defenderEvidenceHash,
      auditorEvidenceHash: verdict.auditorEvidenceHash,
      verdictDigest: verdict.verdictDigest,
    },
    finalVerdict: {
      mode: verdict.mode,
      modeLabel: verdict.modeLabel,
      caseId: verdict.caseId,
      txHash,
    },
  }

  runtime.log(`[OracleCourt][ProofBlock] ${stableStringify(proofBlock)}`)

  return {
    mode: verdict.mode,
    modeLabel: verdict.modeLabel,
    riskScoreBps: verdict.riskScoreBps,
    prosecutorScore: verdict.prosecutorScore,
    defenderScore: verdict.defenderScore,
    auditorScore: verdict.auditorScore,
    prosecutorEvidenceHash: verdict.prosecutorEvidenceHash,
    defenderEvidenceHash: verdict.defenderEvidenceHash,
    auditorEvidenceHash: verdict.auditorEvidenceHash,
    verdictDigest: verdict.verdictDigest,
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
