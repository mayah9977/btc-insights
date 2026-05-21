// lib/market/patterns/detectInstitutionalPattern.ts

import type {
  InstitutionalDirectionalPressure,
  InstitutionalDominantFlow,
  InstitutionalFundingState,
  InstitutionalVolumeState,
  InstitutionalWhaleBias,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot'

export type InstitutionalPatternType =
  | 'LONG_PRESSURE_BUILDING'
  | 'SHORT_PRESSURE_BUILDING'
  | 'LONG_SQUEEZE_RISK'
  | 'SHORT_SQUEEZE_RISK'
  | 'WHALE_DISTRIBUTION'
  | 'LIQUIDITY_SWEEP_RISK'
  | 'INSTITUTIONAL_ABSORPTION'
  | 'NONE'

export type InstitutionalPatternRisk =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'

export type InstitutionalPatternConfidence =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'

export type InstitutionalPatternIntensity =
  | 'WEAK'
  | 'BUILDING'
  | 'AGGRESSIVE'
  | 'EXTREME'

export interface InstitutionalPatternInput {
  snapshotReady: boolean

  oiDeltaAverage: number
  oiDeltaAccum?: number

  oiDirectionalPersistenceAverage?: number

  fundingAverage: number
  fundingState: InstitutionalFundingState | string

  volumeRatioAverage: number
  volumeState: InstitutionalVolumeState | string

  whaleIntensityAverage: number
  whaleBias: InstitutionalWhaleBias | string

  whaleBuyPressure: number
  whaleSellPressure: number

  longLiquidationPressure?: number
  shortLiquidationPressure?: number

  dominantFlow?: InstitutionalDominantFlow | string

  oiDirectionalPressure?:
    | InstitutionalDirectionalPressure
    | string

  fmaiDirectionalPressure?:
    | InstitutionalDirectionalPressure
    | string

  absorptionAccum?: number
  absorptionAverage?: number
  sweepAccum?: number
  sweepAverage?: number

  institutionalEvents?: {
    whaleBurstCount?: number

    longAggressionDuration?: number
    shortAggressionDuration?: number

    longAggressionPersistence?: number
    shortAggressionPersistence?: number

    fundingOverheatDuration?: number

    oiExpansionEventCount?: number

    whaleAbsorptionCount?: number

    liquiditySweepCount?: number

    volatilityShockCount?: number
  }
}

export interface InstitutionalPatternMetricEvidence {
  label: string
  value: string
  note: string
}

export interface InstitutionalPatternResult {
  type: InstitutionalPatternType

  title: string

  risk: InstitutionalPatternRisk

  confidence: InstitutionalPatternConfidence

  intensity: InstitutionalPatternIntensity

  confidenceScore: number

  confidencePercent: number

  summary: string

  reasons: string[]

  metrics: InstitutionalPatternMetricEvidence[]
}

type Candidate = {
  type: Exclude<InstitutionalPatternType, 'NONE'>
  score: number
  risk: InstitutionalPatternRisk
  title: string
  summary: string
  reasons: string[]
  metrics: InstitutionalPatternMetricEvidence[]
}

const THRESHOLDS = {
  MIN_VISIBLE_SCORE: 62,

  MEDIUM_CONFIDENCE: 70,
  HIGH_CONFIDENCE: 84,

  BUILDING_INTENSITY: 68,
  AGGRESSIVE_INTENSITY: 82,
  EXTREME_INTENSITY: 94,

  OI_PERSISTENCE_BUILDING: 0.48,
  OI_PERSISTENCE_STRONG: 0.72,

  WHALE_INTENSITY_BUILDING: 55,
  WHALE_INTENSITY_HIGH: 70,
  WHALE_INTENSITY_EXTREME: 88,

  LIQUIDATION_BUILDING: 1.4,
  LIQUIDATION_HIGH: 2.5,
  LIQUIDATION_EXTREME: 5,

  SWEEP_BUILDING: 2,
  SWEEP_HIGH: 4,
  SWEEP_EXTREME: 7,

  FUNDING_OVERHEAT_BUILDING: 120,
  FUNDING_OVERHEAT_HIGH: 240,
  FUNDING_OVERHEAT_EXTREME: 420,

  AGGRESSION_PERSISTENCE_BUILDING: 3,
  AGGRESSION_PERSISTENCE_HIGH: 5,
  AGGRESSION_PERSISTENCE_EXTREME: 8,

  WHALE_ABSORPTION_BUILDING: 2,
  WHALE_ABSORPTION_HIGH: 4,

  ABSORPTION_AVERAGE_BUILDING: 0.35,
  ABSORPTION_AVERAGE_HIGH: 0.6,

  VOLUME_EXPANSION: 1.2,
  VOLUME_AGGRESSIVE: 1.8,
} as const

const clamp = (
  value: number,
  min: number,
  max: number,
) => Math.min(Math.max(value, min), max)

const safeNumber = (
  value: number | undefined,
  fallback = 0,
) => {
  return Number.isFinite(value)
    ? Number(value)
    : fallback
}

const formatNumber = (
  value: number,
  digits = 2,
) => {
  if (!Number.isFinite(value)) return '-'
  return value.toFixed(digits)
}

const scoreMagnitude = (
  value: number,
  building: number,
  high: number,
  extreme: number,
  maxScore: number,
) => {
  if (value < building) return 0

  if (value >= extreme) return maxScore

  if (value >= high) {
    return maxScore * 0.72
  }

  return maxScore * 0.42
}

const scoreRatioDominance = (
  primary: number,
  secondary: number,
  ratio: number,
  score: number,
) => {
  if (primary <= 0) return 0

  if (secondary <= 0 && primary > 0) {
    return score
  }

  return primary >= secondary * ratio ? score : 0
}

const confidenceFromScore = (
  score: number,
): InstitutionalPatternConfidence => {
  if (score >= THRESHOLDS.HIGH_CONFIDENCE) {
    return 'HIGH'
  }

  if (score >= THRESHOLDS.MEDIUM_CONFIDENCE) {
    return 'MEDIUM'
  }

  return 'LOW'
}

const intensityFromScore = (
  score: number,
): InstitutionalPatternIntensity => {
  if (score >= THRESHOLDS.EXTREME_INTENSITY) {
    return 'EXTREME'
  }

  if (score >= THRESHOLDS.AGGRESSIVE_INTENSITY) {
    return 'AGGRESSIVE'
  }

  if (score >= THRESHOLDS.BUILDING_INTENSITY) {
    return 'BUILDING'
  }

  return 'WEAK'
}

const createNonePattern =
  (): InstitutionalPatternResult => ({
    type: 'NONE',
    title: 'No Dominant Institutional Pressure',
    risk: 'LOW',
    confidence: 'LOW',
    intensity: 'WEAK',
    confidenceScore: 0,
    confidencePercent: 0,
    summary:
      '현재 우세한 기관 압력 구조 감지는 제한적입니다.',
    reasons: [],
    metrics: [],
  })

const normalizeDirectionalPressure = (
  value: string | undefined,
): InstitutionalDirectionalPressure => {
  if (value === 'LONG') return 'LONG'
  if (value === 'SHORT') return 'SHORT'
  return 'NEUTRAL'
}

const normalizeDominantFlow = (
  value: string | undefined,
): InstitutionalDominantFlow => {
  if (value === 'LONG') return 'LONG'
  if (value === 'SHORT') return 'SHORT'
  return 'NEUTRAL'
}

const normalizeWhaleBias = (
  value: string | undefined,
): InstitutionalWhaleBias => {
  if (value === 'ACCUMULATION') {
    return 'ACCUMULATION'
  }

  if (value === 'DISTRIBUTION') {
    return 'DISTRIBUTION'
  }

  return 'NEUTRAL'
}

const normalizeFundingState = (
  value: string | undefined,
): InstitutionalFundingState => {
  if (value === 'LONG_OVERHEATED') {
    return 'LONG_OVERHEATED'
  }

  if (value === 'SHORT_OVERHEATED') {
    return 'SHORT_OVERHEATED'
  }

  return 'NEUTRAL'
}

const normalizeVolumeState = (
  value: string | undefined,
): InstitutionalVolumeState => {
  if (value === 'EXPANSION') return 'EXPANSION'
  if (value === 'WEAK') return 'WEAK'
  return 'NORMAL'
}

export function detectInstitutionalPattern(
  input: InstitutionalPatternInput,
): InstitutionalPatternResult {
  if (!input.snapshotReady) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[INSTITUTIONAL_PATTERN_DEBUG]', {
        FINAL_RESULT: {
          detectedPattern: 'NONE',
          reason: 'snapshotReady is false',
          threshold: THRESHOLDS.MIN_VISIBLE_SCORE,
          finalScore: 0,
          confidence: 'LOW',
          intensity: 'WEAK',
        },
        THRESHOLDS,
      })
    }

    return createNonePattern()
  }

  const oiDirectionalPressure =
    normalizeDirectionalPressure(
      input.oiDirectionalPressure,
    )

  const fmaiDirectionalPressure =
    normalizeDirectionalPressure(
      input.fmaiDirectionalPressure,
    )

  const dominantFlow = normalizeDominantFlow(
    input.dominantFlow,
  )

  const whaleBias = normalizeWhaleBias(
    input.whaleBias,
  )

  const fundingState = normalizeFundingState(
    input.fundingState,
  )

  const volumeState = normalizeVolumeState(
    input.volumeState,
  )

  const oiDeltaAverage = safeNumber(
    input.oiDeltaAverage,
  )

  const oiDirectionalPersistenceAverage =
    clamp(
      safeNumber(
        input.oiDirectionalPersistenceAverage,
      ),
      0,
      1,
    )

  const fundingAverage = safeNumber(
    input.fundingAverage,
  )

  const volumeRatioAverage = safeNumber(
    input.volumeRatioAverage,
    1,
  )

  const whaleIntensityAverage = clamp(
    safeNumber(input.whaleIntensityAverage),
    0,
    100,
  )

  const whaleBuyPressure = Math.max(
    0,
    safeNumber(input.whaleBuyPressure),
  )

  const whaleSellPressure = Math.max(
    0,
    safeNumber(input.whaleSellPressure),
  )

  const longLiquidationPressure =
    Math.max(
      0,
      safeNumber(
        input.longLiquidationPressure,
      ),
    )

  const shortLiquidationPressure =
    Math.max(
      0,
      safeNumber(
        input.shortLiquidationPressure,
      ),
    )

  const absorptionAccum = safeNumber(
    input.absorptionAccum,
  )

  const absorptionAverage = safeNumber(
    input.absorptionAverage,
  )

  const sweepAccum = safeNumber(
    input.sweepAccum,
  )

  const sweepAverage = safeNumber(
    input.sweepAverage,
  )

  const events =
    input.institutionalEvents ?? {}

  const whaleBurstCount = safeNumber(
    events.whaleBurstCount,
  )

  const longAggressionPersistence =
    safeNumber(
      events.longAggressionPersistence,
    )

  const shortAggressionPersistence =
    safeNumber(
      events.shortAggressionPersistence,
    )

  const fundingOverheatDuration =
    safeNumber(
      events.fundingOverheatDuration,
    )

  const oiExpansionEventCount =
    safeNumber(events.oiExpansionEventCount)

  const whaleAbsorptionCount =
    safeNumber(events.whaleAbsorptionCount)

  const liquiditySweepCount =
    safeNumber(events.liquiditySweepCount)

  const volatilityShockCount =
    safeNumber(events.volatilityShockCount)

  const volumeExpansionScore =
    volumeState === 'EXPANSION'
      ? 8
      : volumeRatioAverage >=
          THRESHOLDS.VOLUME_AGGRESSIVE
        ? 8
        : volumeRatioAverage >=
            THRESHOLDS.VOLUME_EXPANSION
          ? 4
          : 0

  const whaleMagnitudeScore =
    scoreMagnitude(
      whaleIntensityAverage,
      THRESHOLDS.WHALE_INTENSITY_BUILDING,
      THRESHOLDS.WHALE_INTENSITY_HIGH,
      THRESHOLDS.WHALE_INTENSITY_EXTREME,
      18,
    )

  const persistenceMagnitudeScore =
    scoreMagnitude(
      oiDirectionalPersistenceAverage,
      THRESHOLDS.OI_PERSISTENCE_BUILDING,
      THRESHOLDS.OI_PERSISTENCE_STRONG,
      0.92,
      16,
    )

  const longLiquidationMagnitudeScore =
    scoreMagnitude(
      longLiquidationPressure,
      THRESHOLDS.LIQUIDATION_BUILDING,
      THRESHOLDS.LIQUIDATION_HIGH,
      THRESHOLDS.LIQUIDATION_EXTREME,
      28,
    )

  const shortLiquidationMagnitudeScore =
    scoreMagnitude(
      shortLiquidationPressure,
      THRESHOLDS.LIQUIDATION_BUILDING,
      THRESHOLDS.LIQUIDATION_HIGH,
      THRESHOLDS.LIQUIDATION_EXTREME,
      28,
    )

  const sweepMagnitudeScore =
    scoreMagnitude(
      liquiditySweepCount,
      THRESHOLDS.SWEEP_BUILDING,
      THRESHOLDS.SWEEP_HIGH,
      THRESHOLDS.SWEEP_EXTREME,
      24,
    )

  const fundingDurationScore =
    scoreMagnitude(
      fundingOverheatDuration,
      THRESHOLDS.FUNDING_OVERHEAT_BUILDING,
      THRESHOLDS.FUNDING_OVERHEAT_HIGH,
      THRESHOLDS.FUNDING_OVERHEAT_EXTREME,
      18,
    )

  const longAggressionScore =
    scoreMagnitude(
      longAggressionPersistence,
      THRESHOLDS.AGGRESSION_PERSISTENCE_BUILDING,
      THRESHOLDS.AGGRESSION_PERSISTENCE_HIGH,
      THRESHOLDS.AGGRESSION_PERSISTENCE_EXTREME,
      18,
    )

  const shortAggressionScore =
    scoreMagnitude(
      shortAggressionPersistence,
      THRESHOLDS.AGGRESSION_PERSISTENCE_BUILDING,
      THRESHOLDS.AGGRESSION_PERSISTENCE_HIGH,
      THRESHOLDS.AGGRESSION_PERSISTENCE_EXTREME,
      18,
    )

  const absorptionMagnitudeScore =
    scoreMagnitude(
      Math.abs(absorptionAverage),
      THRESHOLDS.ABSORPTION_AVERAGE_BUILDING,
      THRESHOLDS.ABSORPTION_AVERAGE_HIGH,
      0.9,
      18,
    )

  const whaleAbsorptionScore =
    scoreMagnitude(
      whaleAbsorptionCount,
      THRESHOLDS.WHALE_ABSORPTION_BUILDING,
      THRESHOLDS.WHALE_ABSORPTION_HIGH,
      7,
      16,
    )

  const candidates: Candidate[] = []

  const longPressureScore =
    (oiDirectionalPressure === 'LONG' ? 18 : 0) +
    (fmaiDirectionalPressure === 'LONG' ? 12 : 0) +
    (dominantFlow === 'LONG' ? 14 : 0) +
    (whaleBias === 'ACCUMULATION' ? 16 : 0) +
    (fundingState === 'LONG_OVERHEATED' ? 8 : 0) +
    scoreRatioDominance(
      whaleBuyPressure,
      whaleSellPressure,
      1.25,
      12,
    ) +
    longAggressionScore +
    persistenceMagnitudeScore +
    whaleMagnitudeScore * 0.6 +
    volumeExpansionScore

  candidates.push({
    type: 'LONG_PRESSURE_BUILDING',
    score: longPressureScore,
    risk:
      longPressureScore >= 82
        ? 'HIGH'
        : 'MEDIUM',
    title: 'Long Pressure Building',
    summary:
      '상승 방향 세력 압력이 강해지고 있습니다.',
    reasons: [
      'dominantFlow와 OI directional pressure가 LONG 방향으로 정렬',
      'Whale accumulation 또는 buy pressure 우세 가능성 감지',
      'Long aggression persistence와 OI persistence가 함께 누적',
    ],
    metrics: [
      {
        label: 'Dominant Flow(우세 흐름)',
        value: dominantFlow,
        note: '30분 누적 우세 flow',
      },
      {
        label: 'OI Persistence(OI 지속성)',
        value: formatNumber(
          oiDirectionalPersistenceAverage,
          2,
        ),
        note: '롱 방향 압력 지속성',
      },
      {
        label: 'Whale Buy Pressure',
        value: formatNumber(
          whaleBuyPressure,
          2,
        ),
        note: '고래 매수 압력 누적',
      },
      {
        label: 'Long Aggression',
        value: String(
          longAggressionPersistence,
        ),
        note: '롱 공격성 persistence',
      },
    ],
  })

  const shortPressureScore =
    (oiDirectionalPressure === 'SHORT'
      ? 18
      : 0) +
    (fmaiDirectionalPressure === 'SHORT'
      ? 12
      : 0) +
    (dominantFlow === 'SHORT' ? 14 : 0) +
    (whaleBias === 'DISTRIBUTION' ? 16 : 0) +
    (fundingState === 'SHORT_OVERHEATED'
      ? 8
      : 0) +
    scoreRatioDominance(
      whaleSellPressure,
      whaleBuyPressure,
      1.25,
      12,
    ) +
    shortAggressionScore +
    persistenceMagnitudeScore +
    whaleMagnitudeScore * 0.6 +
    volumeExpansionScore

  candidates.push({
    type: 'SHORT_PRESSURE_BUILDING',
    score: shortPressureScore,
    risk:
      shortPressureScore >= 82
        ? 'HIGH'
        : 'MEDIUM',
    title: 'Short Pressure Building',
    summary:
      '하락 방향 세력 압력이 강해지고 있습니다.',
    reasons: [
      'dominantFlow와 OI directional pressure가 SHORT 방향으로 정렬',
      'Whale distribution 또는 sell pressure 우세 가능성 감지',
      'Short aggression persistence와 OI persistence가 함께 누적',
    ],
    metrics: [
      {
        label: 'Dominant Flow',
        value: dominantFlow,
        note: '30분 누적 우세 flow',
      },
      {
        label: 'OI Persistence',
        value: formatNumber(
          oiDirectionalPersistenceAverage,
          2,
        ),
        note: '숏 방향 압력 지속성',
      },
      {
        label: 'Whale Sell Pressure',
        value: formatNumber(
          whaleSellPressure,
          2,
        ),
        note: '고래 매도 압력 누적',
      },
      {
        label: 'Short Aggression',
        value: String(
          shortAggressionPersistence,
        ),
        note: '숏 공격성 persistence',
      },
    ],
  })

  const longSqueezeScore =
    longLiquidationMagnitudeScore +
    (fundingState === 'LONG_OVERHEATED'
      ? 18
      : 0) +
    fundingDurationScore +
    sweepMagnitudeScore +
    (whaleBias === 'DISTRIBUTION' ? 14 : 0) +
    scoreRatioDominance(
      whaleSellPressure,
      whaleBuyPressure,
      1.2,
      10,
    ) +
    (dominantFlow === 'SHORT' ? 8 : 0) +
    whaleMagnitudeScore * 0.5

  candidates.push({
    type: 'LONG_SQUEEZE_RISK',
    score: longSqueezeScore,
    risk: 'HIGH',
    title: 'Long Squeeze Risk',
    summary:
      '롱 포지션 청산 위험이 증가하고 있습니다.',
    reasons: [
      'Long liquidation pressure magnitude 증가',
      'Funding overheat duration 누적',
      'Whale distribution 또는 sell pressure와 sweep event가 동반',
    ],
    metrics: [
      {
        label: 'Long Liquidation',
        value: formatNumber(
          longLiquidationPressure,
          2,
        ),
        note: '롱 청산 압력 magnitude',
      },
      {
        label: 'Funding Duration',
        value: `${fundingOverheatDuration}s`,
        note: 'Funding 과열 지속 시간',
      },
      {
        label: 'Sweep Events',
        value: String(liquiditySweepCount),
        note: '유동성 sweep 누적',
      },
      {
        label: 'Whale Bias',
        value: whaleBias,
        note: '청산 유도 방향성 보조',
      },
    ],
  })

  const shortSqueezeScore =
    shortLiquidationMagnitudeScore +
    (fundingState === 'SHORT_OVERHEATED'
      ? 18
      : 0) +
    fundingDurationScore +
    sweepMagnitudeScore +
    (whaleBias === 'ACCUMULATION'
      ? 14
      : 0) +
    scoreRatioDominance(
      whaleBuyPressure,
      whaleSellPressure,
      1.2,
      10,
    ) +
    (dominantFlow === 'LONG' ? 8 : 0) +
    whaleAbsorptionScore +
    absorptionMagnitudeScore * 0.5

  candidates.push({
    type: 'SHORT_SQUEEZE_RISK',
    score: shortSqueezeScore,
    risk: 'HIGH',
    title: 'Short Squeeze Risk',
    summary:
      '숏 포지션 청산 위험이 증가하고 있습니다.',
    reasons: [
      'Short liquidation pressure magnitude 증가',
      'Whale absorption 또는 accumulation 압력 감지',
      'Sweep event와 funding overheat가 함께 누적',
    ],
    metrics: [
      {
        label: 'Short Liquidation',
        value: formatNumber(
          shortLiquidationPressure,
          2,
        ),
        note: '숏 청산 압력 magnitude',
      },
      {
        label: 'Whale Absorption',
        value: String(whaleAbsorptionCount),
        note: '고래 흡수 event count',
      },
      {
        label: 'Absorption Avg',
        value: formatNumber(
          absorptionAverage,
          2,
        ),
        note: '흡수 압력 평균',
      },
      {
        label: 'Sweep Events',
        value: String(liquiditySweepCount),
        note: '유동성 sweep 누적',
      },
    ],
  })

  const whaleDistributionScore =
    (whaleBias === 'DISTRIBUTION' ? 28 : 0) +
    scoreRatioDominance(
      whaleSellPressure,
      whaleBuyPressure,
      1.35,
      22,
    ) +
    whaleMagnitudeScore +
    volumeExpansionScore +
    (dominantFlow === 'SHORT' ? 10 : 0) +
    (liquiditySweepCount >=
    THRESHOLDS.SWEEP_BUILDING
      ? 8
      : 0)

  candidates.push({
    type: 'WHALE_DISTRIBUTION',
    score: whaleDistributionScore,
    risk: 'HIGH',
    title: 'Whale Distribution Pressure',
    summary:
      '고래 매도 흐름 증가 가능성이 감지되고 있습니다.',
    reasons: [
      'Whale bias가 DISTRIBUTION 방향으로 우세',
      'Whale sell pressure가 buy pressure 대비 우세',
      '거래량 확장과 함께 고래 activity intensity 증가',
    ],
    metrics: [
      {
        label: 'Whale Bias',
        value: whaleBias,
        note: '분산/축적 bias',
      },
      {
        label: 'Sell Pressure',
        value: formatNumber(
          whaleSellPressure,
          2,
        ),
        note: '고래 매도 압력',
      },
      {
        label: 'Whale Intensity',
        value: formatNumber(
          whaleIntensityAverage,
          2,
        ),
        note: '고래 활동 강도',
      },
      {
        label: 'Volume',
        value: `${formatNumber(
          volumeRatioAverage,
          2,
        )}x`,
        note: '거래량 확장 상태',
      },
    ],
  })

  const liquiditySweepScore =
    sweepMagnitudeScore +
    scoreMagnitude(
      Math.abs(sweepAverage),
      0.25,
      0.55,
      0.85,
      16,
    ) +
    scoreMagnitude(
      Math.abs(sweepAccum),
      1.2,
      3,
      6,
      14,
    ) +
    (volatilityShockCount >= 2 ? 14 : 0) +
    (whaleBurstCount >= 2 ? 14 : 0) +
    (longLiquidationPressure >=
      THRESHOLDS.LIQUIDATION_BUILDING &&
    shortLiquidationPressure >=
      THRESHOLDS.LIQUIDATION_BUILDING
      ? 14
      : 0) +
    whaleMagnitudeScore * 0.5

  candidates.push({
    type: 'LIQUIDITY_SWEEP_RISK',
    score: liquiditySweepScore,
    risk: 'HIGH',
    title: 'Liquidity Sweep Risk',
    summary:
      '유동성 스윕 기반 변동성 위험이 증가하고 있습니다.',
    reasons: [
      'Liquidity sweep event count 증가',
      'Sweep magnitude와 volatility shock이 함께 누적',
      '양방향 liquidation pressure 확대 가능성 감지',
    ],
    metrics: [
      {
        label: 'Sweep Events',
        value: String(liquiditySweepCount),
        note: '유동성 sweep event count',
      },
      {
        label: 'Sweep Average',
        value: formatNumber(
          sweepAverage,
          2,
        ),
        note: 'sweep 압력 평균',
      },
      {
        label: 'Volatility Shock',
        value: String(volatilityShockCount),
        note: '변동성 충격 event',
      },
      {
        label: 'Whale Burst',
        value: String(whaleBurstCount),
        note: '고래 burst event',
      },
    ],
  })

  const institutionalAbsorptionScore =
    whaleAbsorptionScore +
    absorptionMagnitudeScore +
    scoreMagnitude(
      Math.abs(absorptionAccum),
      1.2,
      3,
      6,
      18,
    ) +
    (whaleBias === 'ACCUMULATION'
      ? 12
      : 0) +
    (dominantFlow === 'LONG' ? 8 : 0) +
    scoreRatioDominance(
      whaleBuyPressure,
      whaleSellPressure,
      1.15,
      8,
    ) +
    whaleMagnitudeScore * 0.45

  candidates.push({
    type: 'INSTITUTIONAL_ABSORPTION',
    score: institutionalAbsorptionScore,
    risk: 'MEDIUM',
    title: 'Institutional Absorption',
    summary:
      '세력 흡수 매집 흐름이 감지되고 있습니다.',
    reasons: [
      'whaleAbsorptionCount와 absorption magnitude 증가',
      'Whale accumulation 또는 buy pressure 우세 가능성 감지',
      'dominantFlow가 LONG 방향일 때 흡수 신뢰도 강화',
    ],
    metrics: [
      {
        label: 'Absorption Accum',
        value: formatNumber(
          absorptionAccum,
          2,
        ),
        note: '흡수 압력 누적',
      },
      {
        label: 'Absorption Avg',
        value: formatNumber(
          absorptionAverage,
          2,
        ),
        note: '흡수 압력 평균',
      },
      {
        label: 'Whale Absorption',
        value: String(whaleAbsorptionCount),
        note: '고래 흡수 event count',
      },
      {
        label: 'Dominant Flow',
        value: dominantFlow,
        note: '흡수 방향성 보조',
      },
    ],
  })

  const sorted = candidates.sort(
    (a, b) => b.score - a.score,
  )

  const top = sorted[0]

  if (process.env.NODE_ENV !== 'production') {
    const finalScore = top?.score ?? 0
    const confidence = confidenceFromScore(finalScore)
    const intensity = intensityFromScore(finalScore)
    const detectedPattern =
      top && finalScore >= THRESHOLDS.MIN_VISIBLE_SCORE
        ? top.type
        : 'NONE'

    const sortedCandidates = sorted.map(
      (candidate) => ({
        type: candidate.type,
        score: Number(candidate.score.toFixed(2)),
        passedThreshold:
          candidate.score >=
          THRESHOLDS.MIN_VISIBLE_SCORE,
      }),
    )

    console.group('[INSTITUTIONAL_PATTERN_DEBUG]')

    console.log('FINAL_RESULT', {
      detectedPattern,
      finalScore: Number(finalScore.toFixed(2)),
      threshold: THRESHOLDS.MIN_VISIBLE_SCORE,
      passed:
        finalScore >= THRESHOLDS.MIN_VISIBLE_SCORE,
    })

    console.log('CONFIDENCE_FLOW', {
      finalScore: Number(finalScore.toFixed(2)),
      confidenceThresholds: {
        MEDIUM_CONFIDENCE:
          THRESHOLDS.MEDIUM_CONFIDENCE,
        HIGH_CONFIDENCE:
          THRESHOLDS.HIGH_CONFIDENCE,
      },
      confidence,
      intensityThresholds: {
        BUILDING_INTENSITY:
          THRESHOLDS.BUILDING_INTENSITY,
        AGGRESSIVE_INTENSITY:
          THRESHOLDS.AGGRESSIVE_INTENSITY,
        EXTREME_INTENSITY:
          THRESHOLDS.EXTREME_INTENSITY,
      },
      intensity,
    })

    console.table(sortedCandidates)

    console.log('SORTED_CANDIDATES', sortedCandidates)

    console.log('NORMALIZED_INPUTS', {
      dominantFlow,
      oiDirectionalPressure,
      fmaiDirectionalPressure,
      whaleBias,
      fundingState,
      volumeState,
    })

    console.log('INPUT_METRICS', {
      oiDeltaAverage,
      oiDirectionalPersistenceAverage,
      fundingAverage,
      volumeRatioAverage,
      whaleIntensityAverage,
      whaleBuyPressure,
      whaleSellPressure,
      longLiquidationPressure,
      shortLiquidationPressure,
      absorptionAccum,
      absorptionAverage,
      sweepAccum,
      sweepAverage,
    })

    console.log('EVENT_METRICS', {
      whaleBurstCount,
      longAggressionPersistence,
      shortAggressionPersistence,
      fundingOverheatDuration,
      oiExpansionEventCount,
      whaleAbsorptionCount,
      liquiditySweepCount,
      volatilityShockCount,
    })

    console.log('SCORE_COMPONENTS', {
      volumeExpansionScore,
      whaleMagnitudeScore,
      persistenceMagnitudeScore,
      longLiquidationMagnitudeScore,
      shortLiquidationMagnitudeScore,
      sweepMagnitudeScore,
      fundingDurationScore,
      longAggressionScore,
      shortAggressionScore,
      absorptionMagnitudeScore,
      whaleAbsorptionScore,
    })

    console.log('PATTERN_SCORES', {
      longPressureScore,
      shortPressureScore,
      longSqueezeScore,
      shortSqueezeScore,
      whaleDistributionScore,
      liquiditySweepScore,
      institutionalAbsorptionScore,
    })

    console.log('THRESHOLDS', THRESHOLDS)

    console.groupEnd()
  }

  if (
    !top ||
    top.score < THRESHOLDS.MIN_VISIBLE_SCORE
  ) {
    return createNonePattern()
  }

  const confidencePercent = clamp(
    Math.round(top.score),
    0,
    100,
  )

  return {
    type: top.type,
    title: top.title,
    risk: top.risk,
    confidence:
      confidenceFromScore(top.score),
    intensity: intensityFromScore(top.score),
    confidenceScore: top.score,
    confidencePercent,
    summary: top.summary,
    reasons: top.reasons,
    metrics: [
      ...top.metrics,
      {
        label: 'Funding',
        value: fundingState,
        note: `avg ${formatNumber(
          fundingAverage * 100,
          4,
        )}%`,
      },
      {
        label: 'OI Delta',
        value: formatNumber(
          oiDeltaAverage,
          4,
        ),
        note: `pressure ${oiDirectionalPressure}`,
      },
    ],
  }
}
