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
  parseAbi,
  parseAbiParameters,
  zeroAddress,
} from 'viem'
import { z } from 'zod'

import { AGGREGATOR_V3_ABI } from './aggregator-v3-abi'
import { evaluateAppeal, type AppealSnapshot } from './appeal'
import { clamp, digestObject, round, stableStringify } from './canonical'
import {
  averageClaimConfidence,
  buildEvidenceDossier,
  summarizeClaimBalance,
  type EvidenceDocumentInput,
  type EvidenceDossier,
} from './dossier'
import { simulatePolicyModes, type PolicySimulationOutput } from './policy-simulator'
import { buildTribunalBriefs, type AgentBrief, type ModeLabel } from './tribunal'

const sourceKindSchema = z.enum(['coingecko', 'coinbaseSpot', 'coinbaseTicker', 'coinpaprika', 'cryptocompare'])

const RWA_VAULT_ABI = parseAbi([
  'function reserveCoverageBps() view returns (uint16)',
  'function attestationAgeSeconds() view returns (uint32)',
  'function redemptionQueueBps() view returns (uint16)',
])

const RECEIVER_STATE_ABI = parseAbi([
  'function latestMode() view returns (uint8)',
  'function latestRiskScoreBps() view returns (uint16)',
  'function latestContradictionCount() view returns (uint16)',
  'function latestContradictionSeverityBps() view returns (uint16)',
  'function latestEvidenceFreshnessScoreBps() view returns (uint16)',
  'function latestAdmissibilityScoreBps() view returns (uint16)',
  'function latestTimestamp() view returns (uint32)',
  'function latestCaseId() view returns (bytes32)',
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
  dossier: z.object({
    documents: z
      .array(
        z.object({
          id: z.string(),
          kind: z.enum([
            'reserveAttestation',
            'issuerDisclosure',
            'custodyStatement',
            'governanceProposal',
            'incidentNote',
          ]),
          sourceLabel: z.string(),
          updatedAtUnix: z.number().int().nonnegative(),
          text: z.string().min(1),
          isProtected: z.boolean().optional(),
        }),
      )
      .min(1),
  }),
  constitution: z.object({
    evidenceSufficiencyMinBps: z.number().int().nonnegative(),
    freshnessMinBps: z.number().int().nonnegative(),
  }),
})

type Config = z.infer<typeof configSchema>
type SourceKind = z.infer<typeof sourceKindSchema>

type TribunalMode = 0 | 1 | 2

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

interface ConstitutionalPrincipleAssessment {
  principle: string
  status: 'SATISFIED' | 'BREACHED'
  reason: string
}

interface AppealSummary {
  outcome: 'NO_PRIOR_CASE' | 'ESCALATE' | 'RELAX' | 'MAINTAIN'
  rationale: string
  confidenceBps: number
  deltas: {
    riskDeltaBps: number
    contradictionCountDelta: number
    contradictionSeverityDeltaBps: number
    freshnessDeltaBps: number
  }
}

interface TribunalVerdict {
  mode: TribunalMode
  modeLabel: ModeLabel
  policyMode: TribunalMode
  policyModeLabel: ModeLabel
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
  sourceFailurePenaltyBps: number
  macroStressBps: number
  contradictionCount: number
  contradictionSeverityBps: number
  evidenceFreshnessScoreBps: number
  admissibilityScoreBps: number
  timestamp: number
  caseId: `0x${string}`
  prosecutorEvidenceHash: `0x${string}`
  defenderEvidenceHash: `0x${string}`
  auditorEvidenceHash: `0x${string}`
  verdictDigest: `0x${string}`
  evidenceRoot: `0x${string}`
  prosecutorBrief: AgentBrief
  defenderBrief: AgentBrief
  auditorBrief: AgentBrief
  dossier: EvidenceDossier
  policySimulation: PolicySimulationOutput
  constitutionalAssessments: ConstitutionalPrincipleAssessment[]
  constitutionalOverrideReason: string | null
  appealOutcome: AppealSummary
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

const modeToLabel = (mode: TribunalMode): ModeLabel => {
  if (mode === 0) return 'NORMAL'
  if (mode === 1) return 'THROTTLE'
  return 'REDEMPTION_ONLY'
}

const modeLabelToNumber = (modeLabel: ModeLabel): TribunalMode => {
  if (modeLabel === 'NORMAL') return 0
  if (modeLabel === 'THROTTLE') return 1
  return 2
}

const modeRank = (modeLabel: ModeLabel): number => {
  if (modeLabel === 'NORMAL') return 0
  if (modeLabel === 'THROTTLE') return 1
  return 2
}

const safeJsonStringify = (value: unknown): string =>
  JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2)

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

const readPreviousReceiverSnapshot = (
  runtime: Runtime<Config>,
  evmClient: EVMClient,
): AppealSnapshot | null => {
  try {
    const latestModeCall = encodeFunctionData({ abi: RECEIVER_STATE_ABI, functionName: 'latestMode' })
    const latestRiskCall = encodeFunctionData({
      abi: RECEIVER_STATE_ABI,
      functionName: 'latestRiskScoreBps',
    })
    const latestContradictionCountCall = encodeFunctionData({
      abi: RECEIVER_STATE_ABI,
      functionName: 'latestContradictionCount',
    })
    const latestContradictionSeverityCall = encodeFunctionData({
      abi: RECEIVER_STATE_ABI,
      functionName: 'latestContradictionSeverityBps',
    })
    const latestFreshnessCall = encodeFunctionData({
      abi: RECEIVER_STATE_ABI,
      functionName: 'latestEvidenceFreshnessScoreBps',
    })

    const latestModeResp = evmClient
      .callContract(runtime, {
        call: encodeCallMsg({
          from: zeroAddress,
          to: runtime.config.receiverAddress as Address,
          data: latestModeCall,
        }),
      })
      .result()

    const latestRiskResp = evmClient
      .callContract(runtime, {
        call: encodeCallMsg({
          from: zeroAddress,
          to: runtime.config.receiverAddress as Address,
          data: latestRiskCall,
        }),
      })
      .result()
    const latestContradictionCountResp = evmClient
      .callContract(runtime, {
        call: encodeCallMsg({
          from: zeroAddress,
          to: runtime.config.receiverAddress as Address,
          data: latestContradictionCountCall,
        }),
      })
      .result()
    const latestContradictionSeverityResp = evmClient
      .callContract(runtime, {
        call: encodeCallMsg({
          from: zeroAddress,
          to: runtime.config.receiverAddress as Address,
          data: latestContradictionSeverityCall,
        }),
      })
      .result()
    const latestFreshnessResp = evmClient
      .callContract(runtime, {
        call: encodeCallMsg({
          from: zeroAddress,
          to: runtime.config.receiverAddress as Address,
          data: latestFreshnessCall,
        }),
      })
      .result()

    const latestMode = Number(
      decodeFunctionResult({
        abi: RECEIVER_STATE_ABI,
        functionName: 'latestMode',
        data: bytesToHex(latestModeResp.data),
      }),
    )

    const latestRiskScoreBps = Number(
      decodeFunctionResult({
        abi: RECEIVER_STATE_ABI,
        functionName: 'latestRiskScoreBps',
        data: bytesToHex(latestRiskResp.data),
      }),
    )
    const latestContradictionCount = Number(
      decodeFunctionResult({
        abi: RECEIVER_STATE_ABI,
        functionName: 'latestContradictionCount',
        data: bytesToHex(latestContradictionCountResp.data),
      }),
    )
    const latestContradictionSeverityBps = Number(
      decodeFunctionResult({
        abi: RECEIVER_STATE_ABI,
        functionName: 'latestContradictionSeverityBps',
        data: bytesToHex(latestContradictionSeverityResp.data),
      }),
    )
    const latestEvidenceFreshnessScoreBps = Number(
      decodeFunctionResult({
        abi: RECEIVER_STATE_ABI,
        functionName: 'latestEvidenceFreshnessScoreBps',
        data: bytesToHex(latestFreshnessResp.data),
      }),
    )

    const mode = modeToLabel(clamp(latestMode, 0, 2) as TribunalMode)

    return {
      mode,
      riskScoreBps: latestRiskScoreBps,
      contradictionCount: latestContradictionCount,
      contradictionSeverityBps: latestContradictionSeverityBps,
      evidenceFreshnessScoreBps: latestEvidenceFreshnessScoreBps,
    }
  } catch {
    return null
  }
}

const resolveConstitutionalMode = (
  config: Config,
  policySimulation: PolicySimulationOutput,
  riskScoreBps: number,
  dossier: EvidenceDossier,
  proposedModeLabel: ModeLabel,
): {
  modeLabel: ModeLabel
  constitutionalAssessments: ConstitutionalPrincipleAssessment[]
  constitutionalOverrideReason: string | null
} => {
  const modeResultsByMode = new Map(policySimulation.modeResults.map((item) => [item.mode, item]))
  const evidenceSufficient =
    dossier.admissibilityScoreBps >= config.constitution.evidenceSufficiencyMinBps
  const freshnessSatisfied = dossier.evidenceFreshnessScoreBps >= config.constitution.freshnessMinBps
  const restrictiveModeRequested = proposedModeLabel !== 'NORMAL'
  const restrictiveModeAllowed = evidenceSufficient && freshnessSatisfied

  const allowedModes = restrictiveModeAllowed
    ? (['NORMAL', 'THROTTLE', 'REDEMPTION_ONLY'] as const)
    : (['NORMAL'] as const)

  const allowedResults = allowedModes
    .map((mode) => modeResultsByMode.get(mode))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const bestAllowedObjective = Math.max(...allowedResults.map((item) => item.objectiveScoreBps))
  let effectiveModeLabel: ModeLabel | null = null
  for (const item of allowedResults) {
    if (item.objectiveScoreBps !== bestAllowedObjective) {
      continue
    }

    if (!effectiveModeLabel || modeRank(item.mode) < modeRank(effectiveModeLabel)) {
      effectiveModeLabel = item.mode
    }
  }
  if (!effectiveModeLabel) {
    throw new Error('No constitutionally allowed mode could be selected')
  }

  const constitutionalOverrideReason =
    proposedModeLabel !== effectiveModeLabel
      ? restrictiveModeRequested && !restrictiveModeAllowed
        ? `Constitutional gate downgraded ${proposedModeLabel} to NORMAL because admissibilityScoreBps=${dossier.admissibilityScoreBps} and evidenceFreshnessScoreBps=${dossier.evidenceFreshnessScoreBps} did not clear restrictive-mode thresholds.`
        : `Constitutional gate replaced ${proposedModeLabel} with ${effectiveModeLabel} to satisfy minimum necessary restriction among allowed modes.`
      : null

  const effectiveResult = modeResultsByMode.get(effectiveModeLabel)
  const lessRestrictiveExists =
    effectiveResult !== undefined &&
    policySimulation.modeResults.some(
      (item) =>
        modeRank(item.mode) < modeRank(effectiveModeLabel) &&
        item.objectiveScoreBps >= effectiveResult.objectiveScoreBps,
    )

  const constitutionalAssessments: ConstitutionalPrincipleAssessment[] = [
    {
      principle: 'Solvency First',
      status:
        effectiveModeLabel === 'REDEMPTION_ONLY' ||
        effectiveModeLabel === 'THROTTLE' ||
        riskScoreBps < 100
          ? 'SATISFIED'
          : 'BREACHED',
      reason:
        effectiveModeLabel === 'REDEMPTION_ONLY' || effectiveModeLabel === 'THROTTLE'
          ? 'Effective mode applies active containment under observed stress.'
          : constitutionalOverrideReason ||
            'Risk is low enough that solvency-first restrictions were not required.',
    },
    {
      principle: 'Orderly Exit',
      status: 'SATISFIED',
      reason: 'Effective modes preserve redemptions to support orderly user exits.',
    },
    {
      principle: 'Minimum Necessary Restriction',
      status: lessRestrictiveExists ? 'BREACHED' : 'SATISFIED',
      reason:
        constitutionalOverrideReason ||
        effectiveResult?.rationale ||
        policySimulation.explanation,
    },
    {
      principle: 'Evidence Sufficiency',
      status: evidenceSufficient ? 'SATISFIED' : 'BREACHED',
      reason: `admissibilityScoreBps=${dossier.admissibilityScoreBps}`,
    },
    {
      principle: 'Freshness Requirement',
      status: freshnessSatisfied ? 'SATISFIED' : 'BREACHED',
      reason: `evidenceFreshnessScoreBps=${dossier.evidenceFreshnessScoreBps}`,
    },
  ]

  return {
    modeLabel: effectiveModeLabel,
    constitutionalAssessments,
    constitutionalOverrideReason,
  }
}

const buildTribunalVerdict = (
  config: Config,
  offchain: OffchainSignals,
  onchain: OnchainSignals,
  rwa: RWASignals,
  timestamp: number,
  previousSnapshot: AppealSnapshot | null,
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

  const documents = config.dossier.documents as EvidenceDocumentInput[]
  const dossier = buildEvidenceDossier(documents, timestamp, {
    reserveCoverageBps: rwa.reserveCoverageBps,
    attestationAgeSeconds: rwa.attestationAgeSeconds,
    redemptionQueueBps: rwa.redemptionQueueBps,
  })

  const contradictionSeverityBps = dossier.contradictionMatrix.reduce(
    (acc, entry) => acc + entry.severityBps,
    0,
  )

  const briefs = buildTribunalBriefs({
    dossier,
    depegBps,
    spreadBps,
    downside24hBps,
    reserveCoverageGapBps,
    attestationLagPenaltyBps,
    redemptionQueuePenaltyBps,
    sourceFailurePenaltyBps,
    macroStressBps,
  })

  const prosecutorScore = clamp(
    reserveCoverageGapBps * 2 +
      attestationLagPenaltyBps +
      redemptionQueuePenaltyBps +
      depegBps * 4 +
      spreadBps * 2 +
      downside24hBps +
      sourceFailurePenaltyBps +
      macroStressBps +
      Math.round(contradictionSeverityBps / 10),
    0,
    10_000,
  )

  const defenderScore = clamp(
    Math.round(averageClaimConfidence(dossier.claims) / 12) +
      (dossier.evidenceFreshnessScoreBps > config.constitution.freshnessMinBps ? 250 : 60) +
      Math.max(0, 250 - offchain.failedSources.length * 50) +
      Math.max(0, 120 - reserveCoverageGapBps),
    0,
    10_000,
  )

  const auditorScore = clamp(
    Math.round(contradictionSeverityBps / 4) +
      Math.max(0, 8000 - dossier.admissibilityScoreBps) +
      Math.max(0, 8000 - dossier.evidenceFreshnessScoreBps) +
      sourceFailurePenaltyBps +
      spreadBps,
    0,
    10_000,
  )

  const riskScoreBps = clamp(Math.round(prosecutorScore + auditorScore - defenderScore), 0, 10_000)

  const policySimulation = simulatePolicyModes({
    prosecutorScore,
    defenderScore,
    auditorScore,
    contradictionSeverityBps,
    evidenceFreshnessScoreBps: dossier.evidenceFreshnessScoreBps,
    admissibilityScoreBps: dossier.admissibilityScoreBps,
  })

  const policyModeLabel = policySimulation.selectedMode
  const policyMode = modeLabelToNumber(policyModeLabel)
  const { modeLabel, constitutionalAssessments, constitutionalOverrideReason } =
    resolveConstitutionalMode(config, policySimulation, riskScoreBps, dossier, policyModeLabel)
  const mode = modeLabelToNumber(modeLabel)

  const appealOutcome = evaluateAppeal(previousSnapshot, {
    mode: modeLabel,
    riskScoreBps,
    contradictionCount: dossier.contradictionMatrix.length,
    contradictionSeverityBps,
    evidenceFreshnessScoreBps: dossier.evidenceFreshnessScoreBps,
  })

  const prosecutorEvidenceHash = digestObject(briefs.prosecutor)
  const defenderEvidenceHash = digestObject(briefs.defender)
  const auditorEvidenceHash = digestObject(briefs.auditor)

  const caseId = digestObject({
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
    evidenceRoot: dossier.evidenceRoot,
  })

  const verdictDigest = digestObject({
    prosecutorEvidenceHash,
    defenderEvidenceHash,
    auditorEvidenceHash,
    riskScoreBps,
    mode,
    timestamp,
    caseId,
    evidenceRoot: dossier.evidenceRoot,
    constitutionalAssessments,
  })

  return {
    mode,
    modeLabel,
    policyMode,
    policyModeLabel,
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
    sourceFailurePenaltyBps,
    macroStressBps,
    contradictionCount: dossier.contradictionMatrix.length,
    contradictionSeverityBps,
    evidenceFreshnessScoreBps: dossier.evidenceFreshnessScoreBps,
    admissibilityScoreBps: dossier.admissibilityScoreBps,
    timestamp,
    caseId,
    prosecutorEvidenceHash,
    defenderEvidenceHash,
    auditorEvidenceHash,
    verdictDigest,
    evidenceRoot: dossier.evidenceRoot,
    prosecutorBrief: briefs.prosecutor,
    defenderBrief: briefs.defender,
    auditorBrief: briefs.auditor,
    dossier,
    policySimulation,
    constitutionalAssessments,
    constitutionalOverrideReason,
    appealOutcome,
  }
}

const writeVerdictOnchain = (
  runtime: Runtime<Config>,
  evmClient: EVMClient,
  verdict: TribunalVerdict,
): string => {
  const encodedVerdict = encodeAbiParameters(
    parseAbiParameters(
      'uint8 mode,uint16 riskScoreBps,uint16 prosecutorScore,uint16 defenderScore,uint16 auditorScore,uint16 contradictionCount,uint16 contradictionSeverityBps,uint16 evidenceFreshnessScoreBps,uint16 admissibilityScoreBps,uint32 timestamp,bytes32 caseId,bytes32 prosecutorEvidenceHash,bytes32 defenderEvidenceHash,bytes32 auditorEvidenceHash,bytes32 verdictDigest',
    ),
    [
      verdict.mode,
      verdict.riskScoreBps,
      verdict.prosecutorScore,
      verdict.defenderScore,
      verdict.auditorScore,
      verdict.contradictionCount,
      verdict.contradictionSeverityBps,
      verdict.evidenceFreshnessScoreBps,
      verdict.admissibilityScoreBps,
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

const onCronTrigger = (
  runtime: Runtime<Config>,
): {
  mode: TribunalMode
  modeLabel: ModeLabel
  policyMode: TribunalMode
  policyModeLabel: ModeLabel
  riskScoreBps: number
  prosecutorScore: number
  defenderScore: number
  auditorScore: number
  evidenceRoot: `0x${string}`
  prosecutorEvidenceHash: `0x${string}`
  defenderEvidenceHash: `0x${string}`
  auditorEvidenceHash: `0x${string}`
  verdictDigest: `0x${string}`
  caseId: `0x${string}`
  appealOutcome: AppealSummary['outcome']
  constitutionalOverrideReason: string
  txHash: string
} => {
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

  const previousSnapshot = readPreviousReceiverSnapshot(runtime, evmClient)
  const timestamp = Math.floor(runtime.now().getTime() / 1000)
  const verdict = buildTribunalVerdict(
    runtime.config,
    offchainSignals,
    onchainSignals,
    rwaSignals,
    timestamp,
    previousSnapshot,
  )

  runtime.log(`[OracleCourt] Offchain signals: ${safeJsonStringify(offchainSignals)}`)
  runtime.log(`[OracleCourt] Onchain signals: ${safeJsonStringify(onchainSignals)}`)
  runtime.log(`[OracleCourt] RWA signals: ${safeJsonStringify(rwaSignals)}`)

  const dossierSummaryForArtifacts = {
    generatedAtUnix: verdict.dossier.generatedAtUnix,
    sourceIds: verdict.dossier.sourceIds,
    protectedSourcesPresent: verdict.dossier.protectedSourcesPresent,
    admissibilityScoreBps: verdict.dossier.admissibilityScoreBps,
    evidenceFreshnessScoreBps: verdict.dossier.evidenceFreshnessScoreBps,
    evidenceRoot: verdict.evidenceRoot,
    claimCount: verdict.dossier.claims.length,
    contradictionCount: verdict.dossier.contradictionMatrix.length,
  }

  const dossierClaimsForArtifacts = verdict.dossier.claims.map((claim) => ({
    claimId: claim.claimId,
    sourceId: claim.sourceId,
    chunkId: claim.chunkId,
    topic: claim.topic,
    polarity: claim.polarity,
    confidenceBps: claim.confidenceBps,
    textSnippet: claim.text.length > 140 ? `${claim.text.slice(0, 137)}...` : claim.text,
  }))

  const briefForArtifacts = (brief: AgentBrief) => ({
    ...brief,
    citations: brief.citations.map((citation) => ({
      sourceId: citation.sourceId,
      chunkId: citation.chunkId,
      claimId: citation.claimId,
      quote: citation.quote,
    })),
  })

  const prosecutorBriefForArtifacts = briefForArtifacts(verdict.prosecutorBrief)
  const defenderBriefForArtifacts = briefForArtifacts(verdict.defenderBrief)
  const auditorBriefForArtifacts = briefForArtifacts(verdict.auditorBrief)

  runtime.log(`[OracleCourt][EvidenceDossier] ${stableStringify(dossierSummaryForArtifacts)}`)
  for (const claim of dossierClaimsForArtifacts) {
    runtime.log(`[OracleCourt][DossierClaim] ${stableStringify(claim)}`)
  }
  runtime.log(
    `[OracleCourt][AgentBrief][PROSECUTOR] ${stableStringify({ brief: prosecutorBriefForArtifacts, evidenceHash: verdict.prosecutorEvidenceHash })}`,
  )
  runtime.log(
    `[OracleCourt][AgentBrief][DEFENDER] ${stableStringify({ brief: defenderBriefForArtifacts, evidenceHash: verdict.defenderEvidenceHash })}`,
  )
  runtime.log(
    `[OracleCourt][AgentBrief][AUDITOR] ${stableStringify({ brief: auditorBriefForArtifacts, evidenceHash: verdict.auditorEvidenceHash })}`,
  )
  runtime.log(
    `[OracleCourt][ContradictionMatrix] ${stableStringify(verdict.dossier.contradictionMatrix)}`,
  )
  runtime.log(`[OracleCourt][PolicySimulation] ${stableStringify(verdict.policySimulation)}`)
  runtime.log(`[OracleCourt][Constitution] ${stableStringify(verdict.constitutionalAssessments)}`)
  runtime.log(`[OracleCourt][AppealOutcome] ${stableStringify(verdict.appealOutcome)}`)
  if (verdict.constitutionalOverrideReason) {
    runtime.log(`[OracleCourt][ConstitutionalOverride] ${verdict.constitutionalOverrideReason}`)
  }

  runtime.log(
    `[OracleCourt] Tribunal scores prosecutor=${verdict.prosecutorScore} defender=${verdict.defenderScore} auditor=${verdict.auditorScore}`,
  )
  runtime.log(
    `[OracleCourt] Verdict mode=${verdict.mode} (${verdict.modeLabel}) policyMode=${verdict.policyMode} (${verdict.policyModeLabel}) riskScoreBps=${verdict.riskScoreBps} caseId=${verdict.caseId} evidenceRoot=${verdict.evidenceRoot} verdictDigest=${verdict.verdictDigest}`,
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
      dossierDocuments: runtime.config.dossier.documents.map((doc) => ({
        id: doc.id,
        kind: doc.kind,
        sourceLabel: doc.sourceLabel,
        updatedAtUnix: doc.updatedAtUnix,
        isProtected: Boolean(doc.isProtected),
      })),
    },
    evidenceDossierSummary: {
      claimBalance: summarizeClaimBalance(verdict.dossier.claims),
      averageClaimConfidenceBps: averageClaimConfidence(verdict.dossier.claims),
      contradictionCount: verdict.dossier.contradictionMatrix.length,
      admissibilityScoreBps: verdict.dossier.admissibilityScoreBps,
      evidenceFreshnessScoreBps: verdict.dossier.evidenceFreshnessScoreBps,
      evidenceRoot: verdict.evidenceRoot,
    },
    agentScores: {
      prosecutorScore: verdict.prosecutorScore,
      defenderScore: verdict.defenderScore,
      auditorScore: verdict.auditorScore,
      riskScoreBps: verdict.riskScoreBps,
      contradictionSeverityBps: verdict.contradictionSeverityBps,
    },
    policySimulation: {
      selectedMode: verdict.policySimulation.selectedMode,
      explanation: verdict.policySimulation.explanation,
    },
    constitutionalOutcome: {
      policyMode: verdict.policyModeLabel,
      effectiveMode: verdict.modeLabel,
      overrideReason: verdict.constitutionalOverrideReason,
    },
    evidenceHashes: {
      evidenceRoot: verdict.evidenceRoot,
      prosecutorEvidenceHash: verdict.prosecutorEvidenceHash,
      defenderEvidenceHash: verdict.defenderEvidenceHash,
      auditorEvidenceHash: verdict.auditorEvidenceHash,
      verdictDigest: verdict.verdictDigest,
    },
    finalVerdict: {
      mode: verdict.mode,
      modeLabel: verdict.modeLabel,
      policyMode: verdict.policyMode,
      policyModeLabel: verdict.policyModeLabel,
      caseId: verdict.caseId,
      txHash,
    },
  }

  const verdictBulletin = {
    bulletinVersion: 'oracle-court-ai-governor-v1',
    caseId: verdict.caseId,
    mode: verdict.modeLabel,
    policyMode: verdict.policyModeLabel,
    riskScoreBps: verdict.riskScoreBps,
    evidenceRoot: verdict.evidenceRoot,
    verdictDigest: verdict.verdictDigest,
    constitutionalAssessments: verdict.constitutionalAssessments,
    constitutionalOverrideReason: verdict.constitutionalOverrideReason,
    policyExplanation: verdict.policySimulation.explanation,
    appealOutcome: verdict.appealOutcome,
    txHash,
  }

  runtime.log(`[OracleCourt][ProofBlock] ${stableStringify(proofBlock)}`)
  runtime.log(`[OracleCourt][VerdictBulletin] ${stableStringify(verdictBulletin)}`)

  return {
    mode: verdict.mode,
    modeLabel: verdict.modeLabel,
    policyMode: verdict.policyMode,
    policyModeLabel: verdict.policyModeLabel,
    riskScoreBps: verdict.riskScoreBps,
    prosecutorScore: verdict.prosecutorScore,
    defenderScore: verdict.defenderScore,
    auditorScore: verdict.auditorScore,
    evidenceRoot: verdict.evidenceRoot,
    prosecutorEvidenceHash: verdict.prosecutorEvidenceHash,
    defenderEvidenceHash: verdict.defenderEvidenceHash,
    auditorEvidenceHash: verdict.auditorEvidenceHash,
    verdictDigest: verdict.verdictDigest,
    caseId: verdict.caseId,
    appealOutcome: verdict.appealOutcome.outcome,
    constitutionalOverrideReason: verdict.constitutionalOverrideReason || '',
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
