//lib/market/institutional/institutionalLatestEvaluation.ts

import type {
  InstitutionalConfirmationAction1h,
} from '@/lib/market/institutional/buildInstitutionalConfirmation1h'

import type {
  InstitutionalPatternConfidence,
  InstitutionalPatternIntensity,
  InstitutionalPatternResult,
  InstitutionalPatternRisk,
  InstitutionalPatternType,
} from '@/lib/market/patterns/detectInstitutionalPattern'

export type InstitutionalReadyPatternType =
  Exclude<
    InstitutionalPatternType,
    'NONE'
  >

export type InstitutionalReadyPatternPresentation =
  Readonly<
    Omit<
      InstitutionalPatternResult,
      'type'
    > & {
      type: InstitutionalReadyPatternType
    }
  >

type InstitutionalLatestEvaluationBase =
  Readonly<{
    confirmedCandleTs: number
    evaluatedAt: number
  }>

export type InstitutionalLatestEvaluation =
  | (
      InstitutionalLatestEvaluationBase &
      Readonly<{
        status: 'NO_PATTERN'
        confirmationAction: null
        confirmationReason: null
        readyPattern: null
      }>
    )
  | (
      InstitutionalLatestEvaluationBase &
      Readonly<{
        status: 'BLOCKED_BY_1H'
        confirmationAction:
          Exclude<
            InstitutionalConfirmationAction1h,
            'ALLOW'
          >
        confirmationReason: string
        readyPattern: null
      }>
    )
  | (
      InstitutionalLatestEvaluationBase &
      Readonly<{
        status: 'READY'
        confirmationAction: 'ALLOW'
        confirmationReason: string
        readyPattern:
          InstitutionalReadyPatternPresentation
      }>
    )

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

function isInstitutionalReadyPatternType(
  value: unknown,
): value is InstitutionalReadyPatternType {
  return (
    value === 'LONG_PRESSURE_BUILDING' ||
    value === 'SHORT_PRESSURE_BUILDING' ||
    value === 'LONG_SQUEEZE_RISK' ||
    value === 'SHORT_SQUEEZE_RISK' ||
    value === 'WHALE_DISTRIBUTION' ||
    value === 'LIQUIDITY_SWEEP_RISK' ||
    value === 'INSTITUTIONAL_ABSORPTION'
  )
}

function isInstitutionalPatternRisk(
  value: unknown,
): value is InstitutionalPatternRisk {
  return (
    value === 'LOW' ||
    value === 'MEDIUM' ||
    value === 'HIGH'
  )
}

function isInstitutionalPatternConfidence(
  value: unknown,
): value is InstitutionalPatternConfidence {
  return (
    value === 'LOW' ||
    value === 'MEDIUM' ||
    value === 'HIGH'
  )
}

function isInstitutionalPatternIntensity(
  value: unknown,
): value is InstitutionalPatternIntensity {
  return (
    value === 'WEAK' ||
    value === 'BUILDING' ||
    value === 'AGGRESSIVE' ||
    value === 'EXTREME'
  )
}

function isInstitutionalPatternMetricEvidence(
  value: unknown,
): boolean {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.label === 'string' &&
    typeof value.value === 'string' &&
    typeof value.note === 'string'
  )
}

export function isInstitutionalReadyPatternPresentation(
  value: unknown,
): value is InstitutionalReadyPatternPresentation {
  if (!isRecord(value)) {
    return false
  }

  if (
    !isInstitutionalReadyPatternType(
      value.type,
    )
  ) {
    return false
  }

  if (
    typeof value.title !== 'string'
  ) {
    return false
  }

  if (
    !isInstitutionalPatternRisk(
      value.risk,
    )
  ) {
    return false
  }

  if (
    !isInstitutionalPatternConfidence(
      value.confidence,
    )
  ) {
    return false
  }

  if (
    !isInstitutionalPatternIntensity(
      value.intensity,
    )
  ) {
    return false
  }

  if (
    !isFiniteNumber(
      value.confidenceScore,
    )
  ) {
    return false
  }

  if (
    !isFiniteNumber(
      value.confidencePercent,
    )
  ) {
    return false
  }

  if (
    typeof value.summary !== 'string'
  ) {
    return false
  }

  if (
    !Array.isArray(
      value.reasons,
    ) ||
    !value.reasons.every(
      reason =>
        typeof reason === 'string',
    )
  ) {
    return false
  }

  if (
    !Array.isArray(
      value.metrics,
    ) ||
    !value.metrics.every(
      isInstitutionalPatternMetricEvidence,
    )
  ) {
    return false
  }

  return true
}

export function isInstitutionalLatestEvaluation(
  value: unknown,
): value is InstitutionalLatestEvaluation {
  if (!isRecord(value)) {
    return false
  }

  if (
    !isFiniteNumber(
      value.confirmedCandleTs,
    )
  ) {
    return false
  }

  if (
    !isFiniteNumber(
      value.evaluatedAt,
    )
  ) {
    return false
  }

  if (
    value.status ===
    'NO_PATTERN'
  ) {
    return (
      value.confirmationAction === null &&
      value.confirmationReason === null &&
      value.readyPattern === null
    )
  }

  if (
    value.status ===
    'BLOCKED_BY_1H'
  ) {
    return (
      (
        value.confirmationAction ===
          'BLOCK' ||
        value.confirmationAction ===
          'WATCH'
      ) &&
      typeof value.confirmationReason ===
        'string' &&
      value.readyPattern === null
    )
  }

  if (
    value.status ===
    'READY'
  ) {
    return (
      value.confirmationAction ===
        'ALLOW' &&
      typeof value.confirmationReason ===
        'string' &&
      isInstitutionalReadyPatternPresentation(
        value.readyPattern,
      )
    )
  }

  return false
}
