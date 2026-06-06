// lib/market/institutional/buildInstitutionalConfirmation1h.ts

import type {
  InstitutionalPatternType,
} from '@/lib/market/patterns/detectInstitutionalPattern'

import type {
  InstitutionalEvidenceSnapshot1h,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot1h'

export type InstitutionalConfirmationAction1h =
  | 'ALLOW'
  | 'BLOCK'
  | 'WATCH'

export type InstitutionalPatternDirection1h =
  | 'LONG'
  | 'SHORT'
  | 'NON_DIRECTIONAL'

export type InstitutionalContextDirection1h =
  | 'LONG'
  | 'SHORT'
  | 'NEUTRAL'

export interface InstitutionalConfirmationResult1h {
  action: InstitutionalConfirmationAction1h
  direction: InstitutionalContextDirection1h
  patternDirection: InstitutionalPatternDirection1h
  score: number
  reason: string
}

/**
 * 기본 정책:
 *
 * - hit rate priority 기준에서는 WATCH도 alert 차단 대상으로 두는 것이 안전합니다.
 * - 단, NO_1H_CONFIRMATION_SNAPSHOT은 초기 운영 직후 1h snapshot이 아직 없어서
 *   정상적인 30m alert까지 막을 수 있는 리스크가 있습니다.
 * - 따라서 emit 단계에서 WATCH를 차단할지 허용할지는 운영 정책으로 분리하는 것이 좋습니다.
 *
 * 추천:
 * - 초기 배포/검증 기간: NO_1H_CONFIRMATION_SNAPSHOT만 임시 허용 가능
 * - 안정화 이후: WATCH 전체 차단 유지
 */
export const DEFAULT_BLOCK_WATCH_1H =
  true

export const ALLOW_NO_SNAPSHOT_DURING_WARMUP_1H =
  false

function getPatternDirection1h(
  pattern: InstitutionalPatternType,
): InstitutionalPatternDirection1h {
  if (
    pattern === 'LONG_PRESSURE_BUILDING' ||
    pattern === 'SHORT_SQUEEZE_RISK' ||
    pattern === 'INSTITUTIONAL_ABSORPTION'
  ) {
    return 'LONG'
  }

  if (
    pattern === 'SHORT_PRESSURE_BUILDING' ||
    pattern === 'LONG_SQUEEZE_RISK' ||
    pattern === 'WHALE_DISTRIBUTION'
  ) {
    return 'SHORT'
  }

  return 'NON_DIRECTIONAL'
}

function resolveContextDirection1h(
  snapshot: InstitutionalEvidenceSnapshot1h,
): {
  direction: InstitutionalContextDirection1h
  score: number
  longScore: number
  shortScore: number
} {
  const longScore =
    (snapshot.fmaiDirectionalPressure === 'LONG'
      ? 1
      : 0) +
    (snapshot.oiDirectionalPressure === 'LONG'
      ? 1
      : 0) +
    (snapshot.dominantFlow === 'LONG'
      ? 1
      : 0) +
    (snapshot.whaleBias === 'ACCUMULATION'
      ? 1
      : 0) +
    (snapshot.volumeState === 'EXPANSION'
      ? 1
      : 0)

  const shortScore =
    (snapshot.fmaiDirectionalPressure === 'SHORT'
      ? 1
      : 0) +
    (snapshot.oiDirectionalPressure === 'SHORT'
      ? 1
      : 0) +
    (snapshot.dominantFlow === 'SHORT'
      ? 1
      : 0) +
    (snapshot.whaleBias === 'DISTRIBUTION'
      ? 1
      : 0) +
    (snapshot.volumeState === 'EXPANSION'
      ? 1
      : 0)

  if (
    longScore >= 3 &&
    longScore > shortScore
  ) {
    return {
      direction: 'LONG',
      score: longScore,
      longScore,
      shortScore,
    }
  }

  if (
    shortScore >= 3 &&
    shortScore > longScore
  ) {
    return {
      direction: 'SHORT',
      score: shortScore,
      longScore,
      shortScore,
    }
  }

  return {
    direction: 'NEUTRAL',
    score: Math.max(
      longScore,
      shortScore,
    ),
    longScore,
    shortScore,
  }
}

export function buildInstitutionalConfirmation1h(
  pattern: InstitutionalPatternType,
  snapshot: InstitutionalEvidenceSnapshot1h | null,
): InstitutionalConfirmationResult1h {
  const patternDirection =
    getPatternDirection1h(pattern)

  if (!snapshot) {
    return {
      action:
        ALLOW_NO_SNAPSHOT_DURING_WARMUP_1H
          ? 'ALLOW'
          : 'WATCH',
      direction: 'NEUTRAL',
      patternDirection,
      score: 0,
      reason:
        'NO_1H_CONFIRMATION_SNAPSHOT',
    }
  }

  if (
    patternDirection === 'NON_DIRECTIONAL'
  ) {
    return {
      action: 'ALLOW',
      direction: 'NEUTRAL',
      patternDirection,
      score: 0,
      reason:
        'NON_DIRECTIONAL_PATTERN_1H_FILTER_BYPASSED',
    }
  }

  const context =
    resolveContextDirection1h(snapshot)

  if (
    context.direction !== 'NEUTRAL' &&
    context.direction !== patternDirection
  ) {
    return {
      action: 'BLOCK',
      direction: context.direction,
      patternDirection,
      score: context.score,
      reason:
        'REVERSED_1H_CONTEXT',
    }
  }

  if (
    context.direction === patternDirection
  ) {
    return {
      action: 'ALLOW',
      direction: context.direction,
      patternDirection,
      score: context.score,
      reason:
        'ALIGNED_1H_CONTEXT',
    }
  }

  return {
    action:
      DEFAULT_BLOCK_WATCH_1H
        ? 'WATCH'
        : 'ALLOW',
    direction: 'NEUTRAL',
    patternDirection,
    score: context.score,
    reason:
      'NEUTRAL_1H_CONTEXT',
  }
}
