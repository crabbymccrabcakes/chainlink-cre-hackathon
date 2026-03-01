import { clamp } from './canonical'
import type { ModeLabel } from './tribunal'

export interface AppealSnapshot {
  mode: ModeLabel
  riskScoreBps: number
  contradictionCount: number
  contradictionSeverityBps: number
  evidenceFreshnessScoreBps: number
}

export interface AppealOutcome {
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

const modeRank = (mode: ModeLabel): number => {
  if (mode === 'NORMAL') return 0
  if (mode === 'THROTTLE') return 1
  return 2
}

export const evaluateAppeal = (
  previous: AppealSnapshot | null,
  current: AppealSnapshot,
): AppealOutcome => {
  if (!previous) {
    return {
      outcome: 'NO_PRIOR_CASE',
      rationale: 'No prior verdict found; tribunal proceeding is treated as initial hearing.',
      confidenceBps: 6500,
      deltas: {
        riskDeltaBps: 0,
        contradictionCountDelta: 0,
        contradictionSeverityDeltaBps: 0,
        freshnessDeltaBps: 0,
      },
    }
  }

  const riskDeltaBps = current.riskScoreBps - previous.riskScoreBps
  const contradictionCountDelta = current.contradictionCount - previous.contradictionCount
  const contradictionSeverityDeltaBps =
    current.contradictionSeverityBps - previous.contradictionSeverityBps
  const freshnessDeltaBps = current.evidenceFreshnessScoreBps - previous.evidenceFreshnessScoreBps

  const previousRank = modeRank(previous.mode)
  const currentRank = modeRank(current.mode)

  const outcome =
    currentRank > previousRank ? 'ESCALATE' : currentRank < previousRank ? 'RELAX' : 'MAINTAIN'

  const rationale =
    outcome === 'ESCALATE'
      ? 'New evidence increased contradiction pressure or risk score; policy escalated.'
      : outcome === 'RELAX'
        ? 'New evidence reduced contradiction pressure and/or improved freshness; policy relaxed.'
        : 'Evidence deltas did not justify a mode transition; policy maintained.'

  const confidenceBps = clamp(
    6200 +
      Math.round(Math.abs(riskDeltaBps) * 0.2) +
      Math.round(Math.abs(contradictionSeverityDeltaBps) * 0.15) +
      Math.round(Math.abs(freshnessDeltaBps) * 0.1),
    6200,
    9800,
  )

  return {
    outcome,
    rationale,
    confidenceBps,
    deltas: {
      riskDeltaBps,
      contradictionCountDelta,
      contradictionSeverityDeltaBps,
      freshnessDeltaBps,
    },
  }
}
