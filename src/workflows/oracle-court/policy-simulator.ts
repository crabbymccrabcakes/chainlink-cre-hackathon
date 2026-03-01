import { clamp } from './canonical'
import type { ModeLabel } from './tribunal'

export interface PolicySimulationInput {
  prosecutorScore: number
  defenderScore: number
  auditorScore: number
  contradictionSeverityBps: number
  evidenceFreshnessScoreBps: number
  admissibilityScoreBps: number
}

export interface ModeSimulationResult {
  mode: ModeLabel
  solvencyProtectionBps: number
  userHarmBps: number
  falsePositiveCostBps: number
  operationalReversibilityBps: number
  objectiveScoreBps: number
  rationale: string
}

export interface PolicySimulationOutput {
  modeResults: ModeSimulationResult[]
  selectedMode: ModeLabel
  explanation: string
}

const simulateMode = (mode: ModeLabel, input: PolicySimulationInput): ModeSimulationResult => {
  const baseRisk = clamp(input.prosecutorScore + input.auditorScore - input.defenderScore, 0, 10_000)
  const contradictionPenalty = Math.round(input.contradictionSeverityBps / 6)
  const evidencePenalty = Math.round((10_000 - input.admissibilityScoreBps) / 2)

  const solvencyProtectionBps =
    mode === 'REDEMPTION_ONLY'
      ? clamp(baseRisk + contradictionPenalty + 1800, 0, 10_000)
      : mode === 'THROTTLE'
        ? clamp(baseRisk + contradictionPenalty + 800, 0, 9800)
        : clamp(baseRisk - 600, 0, 9000)

  const userHarmBps =
    mode === 'REDEMPTION_ONLY'
      ? 8200
      : mode === 'THROTTLE'
        ? 4300
        : 1200

  const falsePositiveCostBps =
    mode === 'REDEMPTION_ONLY'
      ? clamp(6200 - Math.round(baseRisk * 0.4), 900, 9200)
      : mode === 'THROTTLE'
        ? clamp(3800 - Math.round(baseRisk * 0.2), 700, 7600)
        : clamp(1200 + Math.round(baseRisk * 0.35), 1000, 9600)

  const operationalReversibilityBps =
    mode === 'REDEMPTION_ONLY' ? 3000 : mode === 'THROTTLE' ? 7600 : 9300

  const objectiveScoreBps = clamp(
    Math.round(
      solvencyProtectionBps * 0.45 +
        (10_000 - userHarmBps) * 0.2 +
        (10_000 - falsePositiveCostBps) * 0.2 +
        operationalReversibilityBps * 0.15 -
        evidencePenalty,
    ),
    0,
    10_000,
  )

  const rationale =
    mode === 'REDEMPTION_ONLY'
      ? 'Maximizes solvency containment under contradiction-heavy evidence.'
      : mode === 'THROTTLE'
        ? 'Balances containment with user access while preserving reversibility.'
        : 'Minimizes user harm but offers the least solvency protection.'

  return {
    mode,
    solvencyProtectionBps,
    userHarmBps,
    falsePositiveCostBps,
    operationalReversibilityBps,
    objectiveScoreBps,
    rationale,
  }
}

export const simulatePolicyModes = (input: PolicySimulationInput): PolicySimulationOutput => {
  const modeResults: ModeSimulationResult[] = [
    simulateMode('NORMAL', input),
    simulateMode('THROTTLE', input),
    simulateMode('REDEMPTION_ONLY', input),
  ]

  const selected = [...modeResults].sort((a, b) => b.objectiveScoreBps - a.objectiveScoreBps)[0]

  return {
    modeResults,
    selectedMode: selected.mode,
    explanation:
      `${selected.mode} selected by counterfactual policy simulation: ` +
      `${selected.rationale} objective=${selected.objectiveScoreBps}`,
  }
}
