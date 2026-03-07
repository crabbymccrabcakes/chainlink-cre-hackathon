import { cre, type Runtime } from '@chainlink/cre-sdk'
import { z } from 'zod'

import { digestObject, stableStringify } from './canonical'
import type { EvidenceDossier } from './dossier'

export type ModelAgentName = 'PROSECUTOR' | 'DEFENDER' | 'AUDITOR'
export type ModelModeLabel = 'NORMAL' | 'THROTTLE' | 'REDEMPTION_ONLY'
export type ModelGenerationStatus = 'DISABLED' | 'SKIPPED' | 'APPLIED' | 'FALLBACK'

export interface ModelGeneratedFinding {
  summary: string
  claimIds: string[]
  contradictionIds: string[]
  metricKeys: string[]
  severityBps: number
}

export interface ModelGeneratedBrief {
  agent: ModelAgentName
  source: 'model'
  provider: 'openai-responses'
  model: string
  thesis: string
  recommendation: ModelModeLabel
  confidenceBps: number
  findings: ModelGeneratedFinding[]
  generatedAtUnix: number
  promptDigest: `0x${string}`
  responseDigest: `0x${string}`
}

export interface ModelGenerationSummary {
  status: ModelGenerationStatus
  provider: 'openai-responses' | null
  model: string | null
  reason: string
  promptDigest: `0x${string}` | null
  responseDigest: `0x${string}` | null
}

export interface ModelGenerationResult {
  briefs: Partial<Record<ModelAgentName, ModelGeneratedBrief>>
  summary: ModelGenerationSummary
}

export interface ModelDeterministicBriefSummary {
  thesis: string
  policyRecommendation: ModelModeLabel
  confidenceBps: number
  claims: string[]
  contradictionsFound: string[]
}

export interface ModelGenerationInput {
  timestamp: number
  dossier: EvidenceDossier
  previousSnapshot: {
    caseId: `0x${string}`
    mode: ModelModeLabel
    riskScoreBps: number
    contradictionCount: number
    contradictionSeverityBps: number
    evidenceFreshnessScoreBps: number
  } | null
  offchainSignals: {
    usdcMedian: number
    usdcMin: number
    usdcMax: number
    usdc24hChangePct: number
    successfulSources: Array<{ name: string; price: number; change24hPct: number }>
    failedSources: Array<{ name: string; reason: string }>
  }
  onchainSignals: {
    ethUsd: number
    btcUsd: number
  }
  rwaSignals: {
    reserveCoverageBps: number
    attestationAgeSeconds: number
    redemptionQueueBps: number
  }
  derivedMetrics: {
    depegBps: number
    spreadBps: number
    downside24hBps: number
    reserveCoverageGapBps: number
    attestationLagPenaltyBps: number
    redemptionQueuePenaltyBps: number
    sourceFailurePenaltyBps: number
    macroStressBps: number
    prosecutorScore: number
    defenderScore: number
    auditorScore: number
    riskScoreBps: number
    contradictionSeverityBps: number
    contradictionCount: number
    evidenceFreshnessScoreBps: number
    admissibilityScoreBps: number
  }
  policySimulation: {
    selectedMode: ModelModeLabel
    explanation: string
    modeResults: Array<{
      mode: ModelModeLabel
      objectiveScoreBps: number
      rationale: string
    }>
  }
  deterministicBriefs: Record<ModelAgentName, ModelDeterministicBriefSummary>
  constitution: {
    evidenceSufficiencyMinBps: number
    freshnessMinBps: number
  }
}

const modelProviderSchema = z.literal('openai-responses')

export const modelConfigSchema = z.object({
  enabled: z.boolean(),
  provider: modelProviderSchema,
  apiUrl: z.string().min(1),
  model: z.string().min(1),
  apiKeySecretId: z.string().min(1),
  apiKeySecretNamespace: z.string().min(1),
  apiKeySecretOwner: z.string().min(1).optional(),
  maxOutputTokens: z.number().int().min(200).max(4_000),
  temperature: z.number().min(0).max(1),
})

const findingSchema = z.object({
  summary: z.string().min(16).max(280),
  claimIds: z.array(z.string().min(1)).min(1).max(4),
  contradictionIds: z.array(z.string().min(1)).max(4),
  metricKeys: z.array(z.string().min(1)).max(8),
  severityBps: z.number().int().min(0).max(10_000),
})

const agentOutputSchema = z.object({
  thesis: z.string().min(24).max(320),
  recommendation: z.enum(['NORMAL', 'THROTTLE', 'REDEMPTION_ONLY']),
  confidenceBps: z.number().int().min(0).max(10_000),
  findings: z.array(findingSchema).min(1).max(4),
})

const modelBriefPackSchema = z.object({
  prosecutor: agentOutputSchema,
  defender: agentOutputSchema,
  auditor: agentOutputSchema,
})

export type ModelConfig = z.infer<typeof modelConfigSchema>
type ModelBriefPackOutput = z.infer<typeof modelBriefPackSchema>
type RuntimeWithModel<T> = Runtime<T & { model?: ModelConfig }>

const AGENT_ORDER: ModelAgentName[] = ['PROSECUTOR', 'DEFENDER', 'AUDITOR']

const stripCodeFence = (value: string): string => {
  const trimmed = value.trim()

  if (!trimmed.startsWith('```')) {
    return trimmed
  }

  const lines = trimmed.split('\n')
  const withoutOpen = lines[0].startsWith('```') ? lines.slice(1) : lines
  const withoutClose =
    withoutOpen.length > 0 && withoutOpen[withoutOpen.length - 1].trim() === '```'
      ? withoutOpen.slice(0, -1)
      : withoutOpen

  return withoutClose.join('\n').trim()
}

const tryParseJson = (value: string): unknown | null => {
  try {
    return JSON.parse(stripCodeFence(value))
  } catch {
    return null
  }
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

const extractJsonPayload = (value: unknown): unknown | null => {
  const record = asRecord(value)
  if (!record) return null

  if (record.output_parsed && typeof record.output_parsed === 'object') {
    return record.output_parsed
  }

  if (typeof record.output_text === 'string') {
    return tryParseJson(record.output_text)
  }

  if (typeof record.text === 'string') {
    return tryParseJson(record.text)
  }

  if (Array.isArray(record.output)) {
    for (const item of record.output) {
      const outputItem = asRecord(item)
      if (!outputItem) continue

      if (typeof outputItem.text === 'string') {
        const parsed = tryParseJson(outputItem.text)
        if (parsed !== null) return parsed
      }

      const content = Array.isArray(outputItem.content) ? outputItem.content : []
      for (const contentEntry of content) {
        const contentRecord = asRecord(contentEntry)
        if (!contentRecord) continue

        if (typeof contentRecord.text === 'string') {
          const parsed = tryParseJson(contentRecord.text)
          if (parsed !== null) return parsed
        }
      }
    }
  }

  return null
}

const buildPromptPayload = (input: ModelGenerationInput): string =>
  stableStringify({
    rules: {
      responseFormat:
        'Return JSON only. Do not wrap the response in markdown. Do not invent claim IDs, contradiction IDs, or metric keys.',
      recommendationLabels: ['NORMAL', 'THROTTLE', 'REDEMPTION_ONLY'],
      agentOrder: AGENT_ORDER,
    },
    context: {
      timestamp: input.timestamp,
      constitution: input.constitution,
      previousSnapshot: input.previousSnapshot,
      offchainSignals: input.offchainSignals,
      onchainSignals: input.onchainSignals,
      rwaSignals: input.rwaSignals,
      derivedMetrics: input.derivedMetrics,
      policySimulation: input.policySimulation,
      deterministicBriefs: input.deterministicBriefs,
      dossier: {
        evidenceRoot: input.dossier.evidenceRoot,
        admissibilityScoreBps: input.dossier.admissibilityScoreBps,
        evidenceFreshnessScoreBps: input.dossier.evidenceFreshnessScoreBps,
        protectedSourcesPresent: input.dossier.protectedSourcesPresent,
        claims: input.dossier.claims.map((claim) => ({
          claimId: claim.claimId,
          sourceId: claim.sourceId,
          chunkId: claim.chunkId,
          topic: claim.topic,
          polarity: claim.polarity,
          confidenceBps: claim.confidenceBps,
          text: claim.text,
        })),
        contradictionMatrix: input.dossier.contradictionMatrix,
      },
    },
    requiredShape: {
      prosecutor: {
        thesis: 'string',
        recommendation: 'NORMAL | THROTTLE | REDEMPTION_ONLY',
        confidenceBps: '0..10000 integer',
        findings: [
          {
            summary: 'string',
            claimIds: ['existing claim ids only'],
            contradictionIds: ['existing contradiction ids only'],
            metricKeys: ['existing metric keys only'],
            severityBps: '0..10000 integer',
          },
        ],
      },
      defender: 'same shape as prosecutor',
      auditor: 'same shape as prosecutor',
    },
  })

const buildModelRequestBody = (config: ModelConfig, input: ModelGenerationInput) => ({
  model: config.model,
  temperature: config.temperature,
  max_output_tokens: config.maxOutputTokens,
  instructions:
    'You are Oracle Court\'s structured evidence analyst. Produce strict JSON only, grounded exclusively in the supplied dossier, contradictions, and metrics.',
  input: buildPromptPayload(input),
})

const assertSemanticReferences = (
  parsed: ModelBriefPackOutput,
  input: ModelGenerationInput,
): void => {
  const validClaimIds = new Set(input.dossier.claims.map((claim) => claim.claimId))
  const validContradictionIds = new Set(
    input.dossier.contradictionMatrix.map((entry) => entry.id),
  )
  const validMetricKeys = new Set([
    ...Object.keys(input.derivedMetrics),
    'usdcMedian',
    'usdcMin',
    'usdcMax',
    'usdc24hChangePct',
    'ethUsd',
    'btcUsd',
    'reserveCoverageBps',
    'attestationAgeSeconds',
    'redemptionQueueBps',
  ])

  for (const agentKey of ['prosecutor', 'defender', 'auditor'] as const) {
    const agent = parsed[agentKey]

    for (const finding of agent.findings) {
      for (const claimId of finding.claimIds) {
        if (!validClaimIds.has(claimId)) {
          throw new Error(`Model referenced unknown claimId=${claimId}`)
        }
      }

      for (const contradictionId of finding.contradictionIds) {
        if (!validContradictionIds.has(contradictionId)) {
          throw new Error(`Model referenced unknown contradictionId=${contradictionId}`)
        }
      }

      for (const metricKey of finding.metricKeys) {
        if (!validMetricKeys.has(metricKey)) {
          throw new Error(`Model referenced unknown metricKey=${metricKey}`)
        }
      }
    }
  }
}

const defaultSummary = (
  status: ModelGenerationStatus,
  config: ModelConfig | undefined,
  reason: string,
): ModelGenerationSummary => ({
  status,
  provider: config?.provider ?? null,
  model: config?.model ?? null,
  reason,
  promptDigest: null,
  responseDigest: null,
})

const buildModelBriefs = (
  parsed: ModelBriefPackOutput,
  config: ModelConfig,
  timestamp: number,
  promptDigest: `0x${string}`,
  responseDigest: `0x${string}`,
): Partial<Record<ModelAgentName, ModelGeneratedBrief>> => ({
  PROSECUTOR: {
    agent: 'PROSECUTOR',
    source: 'model',
    provider: config.provider,
    model: config.model,
    thesis: parsed.prosecutor.thesis,
    recommendation: parsed.prosecutor.recommendation,
    confidenceBps: parsed.prosecutor.confidenceBps,
    findings: parsed.prosecutor.findings,
    generatedAtUnix: timestamp,
    promptDigest,
    responseDigest,
  },
  DEFENDER: {
    agent: 'DEFENDER',
    source: 'model',
    provider: config.provider,
    model: config.model,
    thesis: parsed.defender.thesis,
    recommendation: parsed.defender.recommendation,
    confidenceBps: parsed.defender.confidenceBps,
    findings: parsed.defender.findings,
    generatedAtUnix: timestamp,
    promptDigest,
    responseDigest,
  },
  AUDITOR: {
    agent: 'AUDITOR',
    source: 'model',
    provider: config.provider,
    model: config.model,
    thesis: parsed.auditor.thesis,
    recommendation: parsed.auditor.recommendation,
    confidenceBps: parsed.auditor.confidenceBps,
    findings: parsed.auditor.findings,
    generatedAtUnix: timestamp,
    promptDigest,
    responseDigest,
  },
})

const parseModelResponse = (body: Uint8Array | string): unknown => {
  const text = Buffer.from(body).toString('utf-8')
  const outerPayload = JSON.parse(text) as unknown
  return extractJsonPayload(outerPayload) ?? outerPayload
}

const invokeModel = <T extends { model?: ModelConfig }>(
  runtime: RuntimeWithModel<T>,
  config: ModelConfig,
  apiKey: string,
  input: ModelGenerationInput,
): unknown => {
  const confidentialHttp = new cre.capabilities.ConfidentialHTTPClient()
  const response = confidentialHttp
    .sendRequest(runtime, {
      request: {
        url: config.apiUrl,
        method: 'POST',
        bodyString: JSON.stringify(buildModelRequestBody(config, input)),
        multiHeaders: {
          authorization: {
            values: [`Bearer ${apiKey}`],
          },
          'content-type': {
            values: ['application/json'],
          },
        },
      },
    })
    .result()

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const errorBody = Buffer.from(response.body).toString('utf-8').slice(0, 240)
    throw new Error(`Model HTTP ${response.statusCode}: ${errorBody}`)
  }

  return parseModelResponse(response.body)
}

export const maybeGenerateModelBriefs = <T extends { model?: ModelConfig }>(
  runtime: RuntimeWithModel<T>,
  input: ModelGenerationInput,
): ModelGenerationResult => {
  const config = runtime.config.model

  if (!config || !config.enabled) {
    return {
      briefs: {},
      summary: defaultSummary('DISABLED', config, 'Model-generated findings disabled in config.'),
    }
  }

  let apiKey: string
  try {
    const secret = runtime
      .getSecret({
        id: config.apiKeySecretId,
        namespace: config.apiKeySecretNamespace,
      })
      .result()

    apiKey = secret.value.trim()
    if (!apiKey) {
      return {
        briefs: {},
        summary: defaultSummary('SKIPPED', config, 'Model API key secret resolved to an empty value.'),
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      briefs: {},
      summary: defaultSummary('SKIPPED', config, `Model secret unavailable: ${message}`),
    }
  }

  const promptPayload = buildPromptPayload(input)
  const promptDigest = digestObject({
    promptPayload,
    provider: config.provider,
    model: config.model,
  })

  try {
    const rawResponse = invokeModel(runtime, config, apiKey, input)
    const responseDigest = digestObject(rawResponse)
    const parsedResult = modelBriefPackSchema.parse(rawResponse)
    assertSemanticReferences(parsedResult, input)

    return {
      briefs: buildModelBriefs(parsedResult, config, input.timestamp, promptDigest, responseDigest),
      summary: {
        status: 'APPLIED',
        provider: config.provider,
        model: config.model,
        reason: 'Schema-validated model-generated findings attached to tribunal briefs.',
        promptDigest,
        responseDigest,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    runtime.log(`[OracleCourt][ModelLayer][Fallback] ${message}`)

    return {
      briefs: {},
      summary: {
        status: 'FALLBACK',
        provider: config.provider,
        model: config.model,
        reason: `Model-generated findings rejected; falling back to deterministic briefs: ${message}`,
        promptDigest,
        responseDigest: null,
      },
    }
  }
}
