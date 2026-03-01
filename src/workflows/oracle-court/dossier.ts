import { clamp, digestObject, round } from './canonical'

export type EvidenceDocumentKind =
  | 'reserveAttestation'
  | 'issuerDisclosure'
  | 'custodyStatement'
  | 'governanceProposal'
  | 'incidentNote'

export interface EvidenceDocumentInput {
  id: string
  kind: EvidenceDocumentKind
  sourceLabel: string
  updatedAtUnix: number
  text: string
  isProtected?: boolean
}

export interface EvidenceChunk {
  chunkId: string
  sourceId: string
  kind: EvidenceDocumentKind
  text: string
}

export interface ExtractedClaim {
  claimId: string
  sourceId: string
  chunkId: string
  kind: EvidenceDocumentKind
  topic: 'reserves' | 'attestation' | 'redemptions' | 'governance' | 'custody' | 'operations'
  polarity: 'supportive' | 'adverse' | 'neutral'
  text: string
  confidenceBps: number
}

export interface ContradictionEntry {
  id: string
  lhs: string
  rhs: string
  explanation: string
  severityBps: number
}

export interface EvidenceDossier {
  generatedAtUnix: number
  sourceIds: string[]
  chunks: EvidenceChunk[]
  claims: ExtractedClaim[]
  contradictionMatrix: ContradictionEntry[]
  admissibilityScoreBps: number
  evidenceFreshnessScoreBps: number
  evidenceRoot: `0x${string}`
  protectedSourcesPresent: boolean
}

interface LiveSignals {
  reserveCoverageBps: number
  attestationAgeSeconds: number
  redemptionQueueBps: number
}

const splitIntoChunks = (text: string, chunkSize = 280): string[] => {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  const sentences = normalized.split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length <= chunkSize) {
      current = (current + ' ' + sentence).trim()
      continue
    }

    if (current) chunks.push(current)
    current = sentence
  }

  if (current) chunks.push(current)
  return chunks
}

const topicFromText = (text: string): ExtractedClaim['topic'] => {
  const t = text.toLowerCase()
  if (/reserve|coverage|backing/.test(t)) return 'reserves'
  if (/attest|audit|fresh|stale/.test(t)) return 'attestation'
  if (/redeem|queue|liquidity/.test(t)) return 'redemptions'
  if (/governance|proposal|vote/.test(t)) return 'governance'
  if (/custody|custodian|segregat/.test(t)) return 'custody'
  return 'operations'
}

const polarityFromText = (text: string): ExtractedClaim['polarity'] => {
  const t = text.toLowerCase()

  const adverseSignals = [
    'shortfall',
    'deteriorat',
    'delay',
    'stale',
    'queue elevated',
    'stress',
    'exception',
    'incident',
    'breach',
    'insufficient',
    'material weakness',
  ]

  const supportiveSignals = [
    'sufficient',
    'fully backed',
    'normal',
    'stable',
    'segregated',
    'timely',
    'healthy',
    'within tolerance',
  ]

  if (adverseSignals.some((signal) => t.includes(signal))) return 'adverse'
  if (supportiveSignals.some((signal) => t.includes(signal))) return 'supportive'
  return 'neutral'
}

const claimConfidence = (text: string, polarity: ExtractedClaim['polarity']): number => {
  const lengthBonus = clamp(Math.round(text.length * 2), 0, 1200)
  const polarityBonus = polarity === 'neutral' ? 0 : 600
  return clamp(5800 + lengthBonus + polarityBonus, 5000, 9600)
}

const computeFreshnessScore = (documents: EvidenceDocumentInput[], nowUnix: number): number => {
  if (documents.length === 0) return 0

  const avgAgeSeconds =
    documents.reduce((acc, doc) => acc + Math.max(0, nowUnix - doc.updatedAtUnix), 0) / documents.length

  return clamp(10000 - Math.round(avgAgeSeconds / 60), 1500, 10000)
}

const buildContradictions = (
  claims: ExtractedClaim[],
  liveSignals: LiveSignals,
): ContradictionEntry[] => {
  const matrix: ContradictionEntry[] = []

  const supportiveReserveClaims = claims.filter(
    (claim) => claim.topic === 'reserves' && claim.polarity === 'supportive',
  )

  if (supportiveReserveClaims.length > 0 && liveSignals.reserveCoverageBps < 9800) {
    matrix.push({
      id: `C-${matrix.length + 1}`,
      lhs: 'Text says reserves are sufficient',
      rhs: `Telemetry reserveCoverageBps=${liveSignals.reserveCoverageBps}`,
      explanation: 'Narrative reserve strength conflicts with observed reserve deterioration',
      severityBps: clamp((9800 - liveSignals.reserveCoverageBps) * 6, 1200, 9500),
    })
  }

  const normalRedemptionClaims = claims.filter(
    (claim) => claim.topic === 'redemptions' && claim.polarity === 'supportive',
  )

  if (normalRedemptionClaims.length > 0 && liveSignals.redemptionQueueBps > 1200) {
    matrix.push({
      id: `C-${matrix.length + 1}`,
      lhs: 'Disclosure says redemptions are normal',
      rhs: `Telemetry redemptionQueueBps=${liveSignals.redemptionQueueBps}`,
      explanation: 'Queue stress indicates redemptions are not behaving as claimed',
      severityBps: clamp((liveSignals.redemptionQueueBps - 1200) * 3, 1000, 9200),
    })
  }

  const freshAttestationClaims = claims.filter(
    (claim) => claim.topic === 'attestation' && claim.polarity === 'supportive',
  )

  if (freshAttestationClaims.length > 0 && liveSignals.attestationAgeSeconds > 43_200) {
    matrix.push({
      id: `C-${matrix.length + 1}`,
      lhs: 'Attestation language implies fresh coverage',
      rhs: `Telemetry attestationAgeSeconds=${liveSignals.attestationAgeSeconds}`,
      explanation: 'Attestation freshness claim is stale relative to telemetry',
      severityBps: clamp(Math.round((liveSignals.attestationAgeSeconds - 43_200) / 120), 900, 9300),
    })
  }

  const governanceLooseClaims = claims.filter(
    (claim) => claim.topic === 'governance' && claim.polarity === 'adverse',
  )

  if (governanceLooseClaims.length > 0) {
    matrix.push({
      id: `C-${matrix.length + 1}`,
      lhs: 'Governance text weakens controls',
      rhs: 'Current policy requires strict mint safety thresholds',
      explanation: 'Governance direction may reduce safety margin relative to current controls',
      severityBps: 4100,
    })
  }

  return matrix
}

export const buildEvidenceDossier = (
  documents: EvidenceDocumentInput[],
  nowUnix: number,
  liveSignals: LiveSignals,
): EvidenceDossier => {
  const chunks: EvidenceChunk[] = []
  const claims: ExtractedClaim[] = []

  let claimCounter = 0

  for (const document of documents) {
    const sourceId = document.id
    const chunkTexts = splitIntoChunks(document.text)

    chunkTexts.forEach((chunkText, index) => {
      const chunkId = `${sourceId}-chunk-${index + 1}`
      const topic = topicFromText(chunkText)
      const polarity = polarityFromText(chunkText)

      chunks.push({
        chunkId,
        sourceId,
        kind: document.kind,
        text: chunkText,
      })

      claimCounter += 1
      claims.push({
        claimId: `CLM-${claimCounter}`,
        sourceId,
        chunkId,
        kind: document.kind,
        topic,
        polarity,
        text: chunkText,
        confidenceBps: claimConfidence(chunkText, polarity),
      })
    })
  }

  const contradictionMatrix = buildContradictions(claims, liveSignals)
  const evidenceFreshnessScoreBps = computeFreshnessScore(documents, nowUnix)

  const contradictionPenalty = contradictionMatrix.reduce(
    (acc, entry) => acc + Math.round(entry.severityBps / 6),
    0,
  )

  const adverseClaimPenalty = claims.filter((claim) => claim.polarity === 'adverse').length * 180

  const admissibilityScoreBps = clamp(
    9200 - contradictionPenalty - adverseClaimPenalty + Math.round(evidenceFreshnessScoreBps / 20),
    1000,
    9800,
  )

  const canonicalEvidenceBundle = {
    generatedAtUnix: nowUnix,
    sourceIds: documents.map((doc) => doc.id).sort(),
    claims: claims.map((claim) => ({
      claimId: claim.claimId,
      sourceId: claim.sourceId,
      chunkId: claim.chunkId,
      topic: claim.topic,
      polarity: claim.polarity,
      confidenceBps: claim.confidenceBps,
      text: claim.text,
    })),
    contradictionMatrix,
    admissibilityScoreBps,
    evidenceFreshnessScoreBps,
  }

  return {
    generatedAtUnix: nowUnix,
    sourceIds: documents.map((doc) => doc.id),
    chunks,
    claims,
    contradictionMatrix,
    admissibilityScoreBps,
    evidenceFreshnessScoreBps,
    evidenceRoot: digestObject(canonicalEvidenceBundle),
    protectedSourcesPresent: documents.some((document) => Boolean(document.isProtected)),
  }
}

export const summarizeClaimBalance = (claims: ExtractedClaim[]): {
  supportive: number
  adverse: number
  neutral: number
} => ({
  supportive: claims.filter((claim) => claim.polarity === 'supportive').length,
  adverse: claims.filter((claim) => claim.polarity === 'adverse').length,
  neutral: claims.filter((claim) => claim.polarity === 'neutral').length,
})

export const averageClaimConfidence = (claims: ExtractedClaim[]): number => {
  if (claims.length === 0) return 0
  return round(claims.reduce((acc, claim) => acc + claim.confidenceBps, 0) / claims.length, 0)
}
