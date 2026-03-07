import { clamp } from './canonical'
import type { ContradictionEntry, EvidenceDossier, ExtractedClaim } from './dossier'
import type { ModelGeneratedBrief } from './model-findings'

export type ModeLabel = 'NORMAL' | 'THROTTLE' | 'REDEMPTION_ONLY'
export type AgentName = 'PROSECUTOR' | 'DEFENDER' | 'AUDITOR'

export interface AgentCitation {
  sourceId: string
  chunkId: string
  claimId: string
  quote: string
}

export interface AgentBrief {
  agent: AgentName
  position: 'restrict' | 'hold' | 'relax'
  thesis: string
  claims: string[]
  citations: AgentCitation[]
  contradictionsFound: string[]
  policyRecommendation: ModeLabel
  confidenceBps: number
  modelGenerated?: ModelGeneratedBrief | null
}

interface BuildBriefInput {
  dossier: EvidenceDossier
  depegBps: number
  spreadBps: number
  downside24hBps: number
  reserveCoverageGapBps: number
  attestationLagPenaltyBps: number
  redemptionQueuePenaltyBps: number
  sourceFailurePenaltyBps: number
  macroStressBps: number
}

const asCitation = (claim: ExtractedClaim): AgentCitation => ({
  sourceId: claim.sourceId,
  chunkId: claim.chunkId,
  claimId: claim.claimId,
  quote: claim.text.length > 96 ? `${claim.text.slice(0, 93)}...` : claim.text,
})

const contradictionNarratives = (entries: ContradictionEntry[]): string[] =>
  entries.map((entry) => `${entry.id}: ${entry.explanation} (severity=${entry.severityBps})`)

const recommendationFromPressure = (value: number): ModeLabel => {
  if (value >= 6200) return 'REDEMPTION_ONLY'
  if (value >= 2200) return 'THROTTLE'
  return 'NORMAL'
}

export interface TribunalBriefPack {
  prosecutor: AgentBrief
  defender: AgentBrief
  auditor: AgentBrief
}

export const buildTribunalBriefs = (input: BuildBriefInput): TribunalBriefPack => {
  const supportiveClaims = input.dossier.claims.filter((claim) => claim.polarity === 'supportive')
  const adverseClaims = input.dossier.claims.filter((claim) => claim.polarity === 'adverse')

  const contradictionSeverity = input.dossier.contradictionMatrix.reduce(
    (acc, entry) => acc + entry.severityBps,
    0,
  )

  const prosecutorPressure = clamp(
    input.reserveCoverageGapBps * 6 +
      input.attestationLagPenaltyBps * 3 +
      input.redemptionQueuePenaltyBps * 3 +
      input.depegBps * 4 +
      input.spreadBps * 2 +
      input.downside24hBps +
      input.sourceFailurePenaltyBps +
      input.macroStressBps +
      Math.round(contradictionSeverity / 8),
    0,
    10_000,
  )

  const defenderPressure = clamp(
    supportiveClaims.length * 420 +
      (input.dossier.evidenceFreshnessScoreBps > 8000 ? 700 : 200) +
      Math.max(0, 1500 - input.redemptionQueuePenaltyBps) +
      Math.max(0, 1200 - input.attestationLagPenaltyBps) +
      Math.max(0, 1000 - input.reserveCoverageGapBps * 2),
    0,
    10_000,
  )

  const auditorPressure = clamp(
    Math.round(contradictionSeverity / 3) +
      Math.max(0, 9000 - input.dossier.admissibilityScoreBps) +
      Math.max(0, 9000 - input.dossier.evidenceFreshnessScoreBps) +
      input.sourceFailurePenaltyBps * 2 +
      input.spreadBps,
    0,
    10_000,
  )

  const prosecutor: AgentBrief = {
    agent: 'PROSECUTOR',
    position: 'restrict',
    thesis:
      prosecutorPressure > 5000
        ? 'Reserve deterioration, stale attestations, and redemption stress create insolvency propagation risk.'
        : 'Stress indicators are present and justify a precautionary restriction posture.',
    claims: [
      `Reserve gap penalty=${input.reserveCoverageGapBps}`,
      `Attestation lag penalty=${input.attestationLagPenaltyBps}`,
      `Redemption queue penalty=${input.redemptionQueuePenaltyBps}`,
      `Contradiction severity total=${contradictionSeverity}`,
    ],
    citations: adverseClaims.slice(0, 2).map(asCitation),
    contradictionsFound: contradictionNarratives(input.dossier.contradictionMatrix),
    policyRecommendation: recommendationFromPressure(prosecutorPressure),
    confidenceBps: clamp(5600 + Math.round(prosecutorPressure * 0.35), 5600, 9800),
  }

  const defender: AgentBrief = {
    agent: 'DEFENDER',
    position: 'hold',
    thesis:
      defenderPressure > 4500
        ? 'Evidence includes stabilizing claims and reversible controls should be preferred over hard shutdown.'
        : 'Current evidence quality is insufficient to justify maximum restrictions.',
    claims: [
      `Supportive claims count=${supportiveClaims.length}`,
      `Evidence freshness score=${input.dossier.evidenceFreshnessScoreBps}`,
      `Admissibility score=${input.dossier.admissibilityScoreBps}`,
      `Residual market stress (depeg+spread)=${input.depegBps + input.spreadBps}`,
    ],
    citations: supportiveClaims.slice(0, 2).map(asCitation),
    contradictionsFound: contradictionNarratives(input.dossier.contradictionMatrix.slice(0, 2)),
    policyRecommendation: recommendationFromPressure(Math.max(0, prosecutorPressure - defenderPressure)),
    confidenceBps: clamp(5400 + Math.round(defenderPressure * 0.28), 5400, 9600),
  }

  const auditor: AgentBrief = {
    agent: 'AUDITOR',
    position: contradictionSeverity > 3000 ? 'restrict' : 'hold',
    thesis:
      contradictionSeverity > 0
        ? 'Narrative claims conflict with telemetry; admissibility and freshness controls require a safety premium.'
        : 'Evidence coherence is acceptable; no major contradiction penalties detected.',
    claims: [
      `Contradictions detected=${input.dossier.contradictionMatrix.length}`,
      `Admissibility score=${input.dossier.admissibilityScoreBps}`,
      `Freshness score=${input.dossier.evidenceFreshnessScoreBps}`,
      `Source failure penalty=${input.sourceFailurePenaltyBps}`,
    ],
    citations: input.dossier.claims.slice(0, 2).map(asCitation),
    contradictionsFound: contradictionNarratives(input.dossier.contradictionMatrix),
    policyRecommendation: recommendationFromPressure(auditorPressure),
    confidenceBps: clamp(5700 + Math.round(auditorPressure * 0.3), 5700, 9900),
  }

  return {
    prosecutor,
    defender,
    auditor,
  }
}
