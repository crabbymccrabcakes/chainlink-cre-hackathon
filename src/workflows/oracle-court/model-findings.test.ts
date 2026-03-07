import { describe, expect } from 'bun:test'
import {
  ConfidentialHttpMock,
  HttpActionsMock,
  newTestRuntime,
  test as creTest,
  type Secrets,
} from '@chainlink/cre-sdk/test'

import { buildEvidenceDossier } from './dossier'
import {
  maybeGenerateModelBriefs,
  type ModelConfig,
  type ModelGenerationInput,
} from './model-findings'

const buildConfig = (overrides: Partial<ModelConfig> = {}): ModelConfig => ({
  enabled: true,
  provider: 'openai-responses',
  apiUrl: 'https://api.openai.com/v1/responses',
  model: 'gpt-4.1-mini',
  apiKeySecretId: 'ORACLE_COURT_MODEL_API_KEY',
  apiKeySecretNamespace: 'default',
  maxOutputTokens: 1200,
  temperature: 0,
  ...overrides,
})

const buildInput = (): ModelGenerationInput => {
  const dossier = buildEvidenceDossier(
    [
      {
        id: 'ATT-1',
        kind: 'reserveAttestation',
        sourceLabel: 'issuer-attestation',
        updatedAtUnix: 1_772_323_200,
        text: 'Independent attestation says reserves are sufficient and fully backed.',
      },
      {
        id: 'DISC-1',
        kind: 'issuerDisclosure',
        sourceLabel: 'issuer-disclosure',
        updatedAtUnix: 1_772_326_800,
        text: 'Issuer disclosure reports redemption operations are normal and orderly.',
      },
      {
        id: 'GOV-1',
        kind: 'governanceProposal',
        sourceLabel: 'governance-forum',
        updatedAtUnix: 1_772_240_400,
        text: 'A governance proposal suggests loosening mint throttles and reserve buffers.',
      },
    ],
    1_772_330_000,
    {
      reserveCoverageBps: 9400,
      attestationAgeSeconds: 172_800,
      redemptionQueueBps: 2800,
    },
  )

  return {
    timestamp: 1_772_330_000,
    dossier,
    previousSnapshot: null,
    offchainSignals: {
      usdcMedian: 0.9985,
      usdcMin: 0.9982,
      usdcMax: 0.999,
      usdc24hChangePct: -0.02,
      successfulSources: [
        { name: 'CoinGecko', price: 0.9985, change24hPct: -0.02 },
        { name: 'Coinbase Spot', price: 0.9987, change24hPct: 0 },
      ],
      failedSources: [{ name: 'CoinPaprika', reason: 'timeout' }],
    },
    onchainSignals: {
      ethUsd: 2450,
      btcUsd: 43800,
    },
    rwaSignals: {
      reserveCoverageBps: 9400,
      attestationAgeSeconds: 172_800,
      redemptionQueueBps: 2800,
    },
    derivedMetrics: {
      depegBps: 15,
      spreadBps: 8,
      downside24hBps: 2,
      reserveCoverageGapBps: 500,
      attestationLagPenaltyBps: 1320,
      redemptionQueuePenaltyBps: 3000,
      sourceFailurePenaltyBps: 45,
      macroStressBps: 25,
      prosecutorScore: 7200,
      defenderScore: 2800,
      auditorScore: 6100,
      riskScoreBps: 10_000,
      contradictionSeverityBps: dossier.contradictionMatrix.reduce(
        (acc, entry) => acc + entry.severityBps,
        0,
      ),
      contradictionCount: dossier.contradictionMatrix.length,
      evidenceFreshnessScoreBps: dossier.evidenceFreshnessScoreBps,
      admissibilityScoreBps: dossier.admissibilityScoreBps,
    },
    policySimulation: {
      selectedMode: 'THROTTLE',
      explanation: 'THROTTLE selected by counterfactual policy simulation.',
      modeResults: [
        {
          mode: 'NORMAL',
          objectiveScoreBps: 4100,
          rationale: 'Too permissive under stress.',
        },
        {
          mode: 'THROTTLE',
          objectiveScoreBps: 7600,
          rationale: 'Balances containment with reversibility.',
        },
        {
          mode: 'REDEMPTION_ONLY',
          objectiveScoreBps: 6100,
          rationale: 'More restrictive than necessary for this scenario.',
        },
      ],
    },
    deterministicBriefs: {
      PROSECUTOR: {
        thesis: 'Deterministic prosecutor thesis',
        policyRecommendation: 'THROTTLE',
        confidenceBps: 7600,
        claims: ['Reserve coverage is below the policy threshold.'],
        contradictionsFound: ['C-1: reserve claim conflicts with telemetry'],
      },
      DEFENDER: {
        thesis: 'Deterministic defender thesis',
        policyRecommendation: 'NORMAL',
        confidenceBps: 6200,
        claims: ['Evidence still includes stabilizing language.'],
        contradictionsFound: [],
      },
      AUDITOR: {
        thesis: 'Deterministic auditor thesis',
        policyRecommendation: 'THROTTLE',
        confidenceBps: 7100,
        claims: ['Evidence freshness is weak and needs a safety premium.'],
        contradictionsFound: ['C-1: reserve claim conflicts with telemetry'],
      },
    },
    constitution: {
      evidenceSufficiencyMinBps: 7000,
      freshnessMinBps: 6500,
    },
  }
}

const buildSecrets = (): Secrets =>
  new Map([['default', new Map([['ORACLE_COURT_MODEL_API_KEY', 'test-model-key']])]])

const buildRuntime = (config?: ModelConfig, secrets?: Secrets): any => {
  const runtime = newTestRuntime(secrets) as any
  runtime.config = config ? { model: config } : {}
  return runtime
}

const encodeResponseBody = (payload: unknown): string =>
  Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')

describe('model findings', () => {
  creTest('applies schema-validated model findings', async () => {
    const input = buildInput()
    const [claimId] = input.dossier.claims.map((claim) => claim.claimId)
    const [contradictionId] = input.dossier.contradictionMatrix.map((entry) => entry.id)

    const mock = ConfidentialHttpMock.testInstance()
    mock.sendRequest = (request) => {
      expect(request.request?.url).toBe('https://api.openai.com/v1/responses')
      expect(request.request?.multiHeaders.Authorization?.values[0]).toBe('Bearer test-model-key')
      expect(request.request?.body.case).toBe('bodyString')

      return {
        statusCode: 200,
        body: encodeResponseBody({
          output_text: JSON.stringify({
            prosecutor: {
              thesis: 'Model prosecutor thesis supporting throttle under stress.',
              recommendation: 'THROTTLE',
              confidenceBps: 7800,
              findings: [
                {
                  summary: 'Reserve coverage and queue pressure justify mint restriction.',
                  claimIds: [claimId],
                  contradictionIds: [contradictionId],
                  metricKeys: ['reserveCoverageGapBps', 'redemptionQueueBps', 'riskScoreBps'],
                  severityBps: 7200,
                },
              ],
            },
            defender: {
              thesis: 'Model defender thesis favoring a reversible response.',
              recommendation: 'NORMAL',
              confidenceBps: 6100,
              findings: [
                {
                  summary: 'Issuer disclosures still support a reversible posture.',
                  claimIds: [claimId],
                  contradictionIds: [],
                  metricKeys: ['admissibilityScoreBps', 'evidenceFreshnessScoreBps'],
                  severityBps: 3900,
                },
              ],
            },
            auditor: {
              thesis: 'Model auditor thesis emphasizing contradiction pressure.',
              recommendation: 'THROTTLE',
              confidenceBps: 7400,
              findings: [
                {
                  summary: 'Contradiction pressure warrants a safety premium.',
                  claimIds: [claimId],
                  contradictionIds: [contradictionId],
                  metricKeys: ['contradictionSeverityBps', 'riskScoreBps'],
                  severityBps: 6800,
                },
              ],
            },
          }),
        }),
      }
    }

    const result = await maybeGenerateModelBriefs(buildRuntime(buildConfig(), buildSecrets()), input)

    expect(result.summary.status).toBe('APPLIED')
    expect(result.summary.provider).toBe('openai-responses')
    expect(result.summary.promptDigest?.startsWith('0x')).toBe(true)
    expect(result.summary.responseDigest?.startsWith('0x')).toBe(true)
    expect(result.briefs.PROSECUTOR?.provider).toBe('openai-responses')
    expect(result.briefs.DEFENDER?.findings.length).toBe(1)
  })

  creTest('falls back when the model references unknown claim ids', async () => {
    const input = buildInput()
    const [contradictionId] = input.dossier.contradictionMatrix.map((entry) => entry.id)

    const mock = ConfidentialHttpMock.testInstance()
    mock.sendRequest = () => ({
      statusCode: 200,
      body: encodeResponseBody({
        output_text: JSON.stringify({
          prosecutor: {
            thesis: 'Invalid prosecutor thesis with fabricated references.',
            recommendation: 'THROTTLE',
            confidenceBps: 7800,
            findings: [
              {
                summary: 'This response fabricates a claim reference.',
                claimIds: ['CLM-999'],
                contradictionIds: [contradictionId],
                metricKeys: ['riskScoreBps'],
                severityBps: 7200,
              },
            ],
          },
          defender: {
            thesis: 'Invalid defender thesis with fabricated references.',
            recommendation: 'NORMAL',
            confidenceBps: 6100,
            findings: [
              {
                summary: 'This response fabricates a claim reference too.',
                claimIds: ['CLM-999'],
                contradictionIds: [],
                metricKeys: ['admissibilityScoreBps'],
                severityBps: 3900,
              },
            ],
          },
          auditor: {
            thesis: 'Invalid auditor thesis with fabricated references.',
            recommendation: 'THROTTLE',
            confidenceBps: 7400,
            findings: [
              {
                summary: 'This response fabricates a claim reference as well.',
                claimIds: ['CLM-999'],
                contradictionIds: [contradictionId],
                metricKeys: ['contradictionSeverityBps'],
                severityBps: 6800,
              },
            ],
          },
        }),
      }),
    })

    const result = await maybeGenerateModelBriefs(buildRuntime(buildConfig(), buildSecrets()), input)

    expect(result.summary.status).toBe('FALLBACK')
    expect(result.briefs.PROSECUTOR).toBeUndefined()
    expect(result.summary.reason).toContain('unknown claimId=CLM-999')
  })

  creTest('stays disabled when the feature is not configured', async () => {
    const result = await maybeGenerateModelBriefs(buildRuntime(undefined, buildSecrets()), buildInput())

    expect(result.summary.status).toBe('DISABLED')
    expect(result.briefs.PROSECUTOR).toBeUndefined()
  })

  creTest('uses a local simulation config fallback when the CRE secret is missing', async () => {
    const input = buildInput()
    const [claimId] = input.dossier.claims.map((claim) => claim.claimId)
    const [contradictionId] = input.dossier.contradictionMatrix.map((entry) => entry.id)

    const mock = HttpActionsMock.testInstance()
    mock.sendRequest = (request) => {
      expect(request.url).toBe('https://api.openai.com/v1/responses')
      expect(request.method).toBe('POST')
      expect(request.multiHeaders?.Authorization?.values[0]).toBe('Bearer test-local-model-key')

      return {
        statusCode: 200,
        body: encodeResponseBody({
          output_text: JSON.stringify({
            prosecutor: {
              thesis: 'Local fallback prosecutor thesis supporting throttle under stress.',
              recommendation: 'THROTTLE',
              confidenceBps: 7800,
              findings: [
                {
                  summary: 'Local fallback identifies reserve and queue stress from validated evidence.',
                  claimIds: [claimId],
                  contradictionIds: [contradictionId],
                  metricKeys: ['reserveCoverageGapBps', 'redemptionQueueBps', 'riskScoreBps'],
                  severityBps: 7200,
                },
              ],
            },
            defender: {
              thesis: 'Local fallback defender thesis favoring a reversible response.',
              recommendation: 'NORMAL',
              confidenceBps: 6100,
              findings: [
                {
                  summary: 'Local fallback still finds mitigating evidence in issuer disclosures.',
                  claimIds: [claimId],
                  contradictionIds: [],
                  metricKeys: ['admissibilityScoreBps', 'evidenceFreshnessScoreBps'],
                  severityBps: 3900,
                },
              ],
            },
            auditor: {
              thesis: 'Local fallback auditor thesis emphasizing contradiction pressure.',
              recommendation: 'THROTTLE',
              confidenceBps: 7400,
              findings: [
                {
                  summary: 'Local fallback concludes contradiction pressure warrants a safety premium.',
                  claimIds: [claimId],
                  contradictionIds: [contradictionId],
                  metricKeys: ['contradictionSeverityBps', 'riskScoreBps'],
                  severityBps: 6800,
                },
              ],
            },
          }),
        }),
      }
    }

    const result = await maybeGenerateModelBriefs(
      buildRuntime(buildConfig({ localApiKey: 'test-local-model-key' })),
      input,
    )

    expect(result.summary.status).toBe('APPLIED')
    expect(result.summary.reason).toContain('local simulation config fallback')
    expect(result.briefs.PROSECUTOR?.provider).toBe('openai-responses')
  })

  creTest('skips model generation when the API key is unavailable everywhere', async () => {
    const result = await maybeGenerateModelBriefs(buildRuntime(buildConfig()), buildInput())

    expect(result.summary.status).toBe('SKIPPED')
    expect(result.summary.reason).toContain('CRE secret or local simulation config fallback')
    expect(result.briefs.PROSECUTOR).toBeUndefined()
  })
})
