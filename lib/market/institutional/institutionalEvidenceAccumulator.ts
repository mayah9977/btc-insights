// lib/market/institutional/institutionalEvidenceAccumulator.ts

import { getMarketSnapshot } from '@/lib/market/engine/marketSnapshot'

import {
  accumulateInstitutionalEvidence1h,
  freezeInstitutionalSnapshot1h,
} from '@/lib/market/institutional/institutionalEvidenceAccumulator1h'

import {
  useInstitutionalEvidenceStore1h,
} from '@/lib/market/institutional/institutionalEvidenceStore1h'

import {
  buildInstitutionalConfirmation1h,
} from '@/lib/market/institutional/buildInstitutionalConfirmation1h'

import type {
  InstitutionalEvidenceSnapshot,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot'

import type {
  InstitutionalEvidenceSnapshot1h,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot1h'

import {
  detectInstitutionalPattern,
} from '@/lib/market/patterns/detectInstitutionalPattern'

type InstitutionalEventsAccumulator = {
  whaleBurstCount: number

  longAggressionDuration: number
  shortAggressionDuration: number

  longAggressionPersistence: number
  shortAggressionPersistence: number

  fundingOverheatDuration: number

  oiExpansionEventCount: number

  whaleAbsorptionCount: number

  liquiditySweepCount: number

  volatilityShockCount: number
}

type InternalAccumulator = {
  startTs: number

  sampleCount: number

  oiDeltaAccum: number

  oiExpansionVelocityAccum: number
  oiCompressionVelocityAccum: number
  oiTrendStrengthAccum: number
  oiDirectionalPersistenceAccum: number

  fundingAccum: number
  fundingMax: number
  fundingMin: number

  volumeRatioAccum: number
  volumeExpansionCount: number
  volumeWeakCount: number

  whaleIntensityAccum: number

  whaleRatioAccum: number

  whaleNetRatioAccum: number
  whaleBuyPressure: number
  whaleSellPressure: number

  fmaiAccum: number

  absorptionAccum: number
  sweepAccum: number

  longLiquidationPressure: number
  shortLiquidationPressure: number

  institutionalEvents: InstitutionalEventsAccumulator
}

type InstitutionalPatternSignalPayload = {
  type: 'INSTITUTIONAL_PATTERN_SIGNAL'
  pattern: string
  intensity: string
  risk: string
  summary: string
  confirmedCandleTs: number
  ts: number
}

let accumulator: InternalAccumulator =
  createEmptyAccumulator()

let lastFrozenSnapshot:
  | InstitutionalEvidenceSnapshot
  | null = null

let lastFrozenCandleTs: number | null = null

const emittedInstitutionalPatternKeys =
  new Set<string>()

function createEmptyAccumulator(): InternalAccumulator {
  return {
    startTs: Date.now(),

    sampleCount: 0,

    oiDeltaAccum: 0,

    oiExpansionVelocityAccum: 0,
    oiCompressionVelocityAccum: 0,
    oiTrendStrengthAccum: 0,
    oiDirectionalPersistenceAccum: 0,

    fundingAccum: 0,
    fundingMax: Number.NEGATIVE_INFINITY,
    fundingMin: Number.POSITIVE_INFINITY,

    volumeRatioAccum: 0,
    volumeExpansionCount: 0,
    volumeWeakCount: 0,

    whaleIntensityAccum: 0,

    whaleRatioAccum: 0,

    whaleNetRatioAccum: 0,
    whaleBuyPressure: 0,
    whaleSellPressure: 0,

    fmaiAccum: 0,

    absorptionAccum: 0,
    sweepAccum: 0,

    longLiquidationPressure: 0,
    shortLiquidationPressure: 0,

    institutionalEvents: {
      whaleBurstCount: 0,

      longAggressionDuration: 0,
      shortAggressionDuration: 0,

      longAggressionPersistence: 0,
      shortAggressionPersistence: 0,

      fundingOverheatDuration: 0,

      oiExpansionEventCount: 0,

      whaleAbsorptionCount: 0,

      liquiditySweepCount: 0,

      volatilityShockCount: 0,
    },
  }
}

async function publishInstitutionalPatternSignal(
  payload: InstitutionalPatternSignalPayload,
) {
  if (typeof window === 'undefined') {
    console.log(
      '[INSTITUTIONAL_PATTERN_EMIT_SKIPPED]',
      {
        reason:
          'SERVER_RUNTIME_ROUTE_DELEGATION_UNAVAILABLE',
        pattern: payload.pattern,
        confirmedCandleTs:
          payload.confirmedCandleTs,
      },
    )

    return
  }

  try {
    const response = await fetch(
      '/api/alerts/institutional-pattern',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      console.error(
        '[INSTITUTIONAL_PATTERN_EMIT_ROUTE_ERROR]',
        {
          status: response.status,
          pattern: payload.pattern,
          confirmedCandleTs:
            payload.confirmedCandleTs,
        },
      )

      return
    }

    console.log(
      '[INSTITUTIONAL_PATTERN_EMIT_ROUTE_PUBLISHED]',
      payload,
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_PATTERN_EMIT_ROUTE_FETCH_ERROR]',
      error,
    )
  }
}

async function saveFinalized30mSnapshotViaRoute(
  snapshot: InstitutionalEvidenceSnapshot,
) {
  if (typeof window === 'undefined') {
    console.log(
      '[FINALIZED_SNAPSHOT_SAVE_ROUTE_SKIPPED_30M]',
      {
        reason:
          'SERVER_RUNTIME_ROUTE_DELEGATION_UNAVAILABLE',
        confirmedCandleTs:
          snapshot.confirmedCandleTs,
      },
    )

    return
  }

  try {
    const response = await fetch(
      '/api/institutional/finalized/save',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeframe: '30m',
          snapshot,
        }),
      },
    )

    if (!response.ok) {
      console.error(
        '[FINALIZED_SNAPSHOT_SAVE_ROUTE_ERROR_30M]',
        {
          status: response.status,
          confirmedCandleTs:
            snapshot.confirmedCandleTs,
        },
      )

      return
    }

    console.log(
      '[FINALIZED_SNAPSHOT_SAVE_ROUTE_PUBLISHED_30M]',
      {
        confirmedCandleTs:
          snapshot.confirmedCandleTs,
        sampleCount:
          snapshot.sampleCount,
      },
    )
  } catch (error) {
    console.error(
      '[FINALIZED_SNAPSHOT_SAVE_ROUTE_FETCH_ERROR_30M]',
      {
        confirmedCandleTs:
          snapshot.confirmedCandleTs,
        error,
      },
    )
  }
}

function emitInstitutionalPatternSignal(
  snapshot: InstitutionalEvidenceSnapshot,
  preferredSnapshot1h?: InstitutionalEvidenceSnapshot1h | null,
) {
  try {
    const detectedPattern =
      detectInstitutionalPattern({
        snapshotReady: true,

        oiDeltaAverage:
          snapshot.oiDeltaAverage,

        oiDeltaAccum:
          snapshot.oiDeltaAccum,

        oiDirectionalPersistenceAverage:
          snapshot
            .oiDirectionalPersistenceAverage,

        fundingAverage:
          snapshot.fundingAverage,

        fundingState:
          snapshot.fundingState,

        volumeRatioAverage:
          snapshot.volumeRatioAverage,

        volumeState:
          snapshot.volumeState,

        whaleIntensityAverage:
          snapshot.whaleIntensityAverage,

        whaleBias:
          snapshot.whaleBias,

        whaleBuyPressure:
          snapshot.whaleBuyPressure,

        whaleSellPressure:
          snapshot.whaleSellPressure,

        longLiquidationPressure:
          snapshot.longLiquidationPressure,

        shortLiquidationPressure:
          snapshot.shortLiquidationPressure,

        dominantFlow:
          snapshot.dominantFlow,

        oiDirectionalPressure:
          snapshot.oiDirectionalPressure,

        fmaiDirectionalPressure:
          snapshot.fmaiDirectionalPressure,

        absorptionAccum:
          snapshot.absorptionAccum,

        absorptionAverage:
          snapshot.absorptionAverage,

        sweepAccum:
          snapshot.sweepAccum,

        sweepAverage:
          snapshot.sweepAverage,

        institutionalEvents:
          snapshot.institutionalEvents,
      })

    if (
      !detectedPattern ||
      detectedPattern.type === 'NONE'
    ) {
      console.log(
        '[INSTITUTIONAL_PATTERN_EMIT_SKIPPED]',
        {
          reason: 'NONE_PATTERN',
          confirmedCandleTs:
            snapshot.confirmedCandleTs,
        },
      )

      return
    }

    const storeSnapshot1h =
      useInstitutionalEvidenceStore1h
        .getState()
        .snapshot

    const snapshot1h =
      preferredSnapshot1h?.confirmedCandleTs ===
      snapshot.confirmedCandleTs
        ? preferredSnapshot1h
        : storeSnapshot1h

    const confirmationSnapshot1h =
      snapshot1h?.confirmedCandleTs ===
      snapshot.confirmedCandleTs
        ? snapshot1h
        : null

    const confirmation1h =
      buildInstitutionalConfirmation1h(
        detectedPattern.type,
        confirmationSnapshot1h,
      )

    const dedupeKey =
      `${detectedPattern.type}:${snapshot.confirmedCandleTs}`

    console.log(
      '[INSTITUTIONAL_PATTERN_1H_CONFIRMATION]',
      {
        pattern:
          detectedPattern.type,
        confirmedCandleTs:
          snapshot.confirmedCandleTs,
        confirmation1h,
      },
    )

    if (confirmation1h.action !== 'ALLOW') {
      console.log(
        '[INSTITUTIONAL_PATTERN_EMIT_BLOCKED_BY_1H]',
        {
          pattern:
            detectedPattern.type,
          confirmedCandleTs:
            snapshot.confirmedCandleTs,
          confirmation1h,
        },
      )

      return
    }

    if (
      emittedInstitutionalPatternKeys.has(
        dedupeKey,
      )
    ) {
      console.log(
        '[INSTITUTIONAL_PATTERN_EMIT_DEDUPED]',
        {
          dedupeKey,
        },
      )

      return
    }

    emittedInstitutionalPatternKeys.add(
      dedupeKey,
    )

    const payload: InstitutionalPatternSignalPayload =
      {
        type:
          'INSTITUTIONAL_PATTERN_SIGNAL',

        pattern:
          detectedPattern.type,

        intensity:
          detectedPattern.intensity,

        risk:
          detectedPattern.risk,

        summary:
          detectedPattern.summary,

        confirmedCandleTs:
          snapshot.confirmedCandleTs,

        ts: Date.now(),
      }

    console.log(
      '[INSTITUTIONAL_PATTERN_EMIT]',
      {
        dedupeKey,
        payload,
      },
    )

    void publishInstitutionalPatternSignal(
      payload,
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_PATTERN_EMIT_ERROR]',
      error,
    )
  }
}

export function accumulateInstitutionalEvidence() {
  const snapshot = getMarketSnapshot()

  const oiDelta = Number(snapshot.oiDelta ?? 0)

  const oiExpansionVelocity = Number(
    snapshot.oiExpansionVelocity ?? 0,
  )

  const oiCompressionVelocity = Number(
    snapshot.oiCompressionVelocity ?? 0,
  )

  const oiTrendStrength = Number(
    snapshot.oiTrendStrength ?? 0,
  )

  const oiDirectionalPersistence = Number(
    snapshot.oiDirectionalPersistence ?? 0,
  )

  const volumeRatio = Number(snapshot.volumeRatio ?? 1)

  const fundingRate = Number(snapshot.fundingRate ?? 0)

  const whaleIntensity = Number(
    snapshot.whaleIntensity ?? 0,
  )

  const whaleNetRatio = Number(
    snapshot.whaleNetRatio ?? 0,
  )

  const whaleRatio = Number(snapshot.whaleRatio ?? 0)

  const fmai = Number(snapshot.fmai ?? 0)

  const absorption = Number(snapshot.absorption ?? 0)

  const sweep = Number(snapshot.sweep ?? 0)

  const volatilityShock = Number(
    (snapshot as any).volatilityShock ?? 0,
  )

  if (
    whaleIntensity >= 80 &&
    whaleRatio >= 0.35
  ) {
    accumulator.institutionalEvents
      .whaleBurstCount += 1
  }

  if (
    whaleNetRatio >= 0.18 &&
    oiDelta > 0 &&
    whaleIntensity >= 60
  ) {
    accumulator.institutionalEvents
      .longAggressionDuration += 30

    accumulator.institutionalEvents
      .longAggressionPersistence += 1
  }

  if (
    whaleNetRatio <= -0.18 &&
    oiDelta < 0 &&
    whaleIntensity >= 60
  ) {
    accumulator.institutionalEvents
      .shortAggressionDuration += 30

    accumulator.institutionalEvents
      .shortAggressionPersistence += 1
  }

  if (Math.abs(fundingRate) >= 0.0015) {
    accumulator.institutionalEvents
      .fundingOverheatDuration += 30
  }

  if (
    oiExpansionVelocity >= 0.25 &&
    oiTrendStrength >= 40
  ) {
    accumulator.institutionalEvents
      .oiExpansionEventCount += 1
  }

  if (Math.abs(absorption) >= 0.6) {
    accumulator.institutionalEvents
      .whaleAbsorptionCount += 1
  }

  if (Math.abs(sweep) >= 0.6) {
    accumulator.institutionalEvents
      .liquiditySweepCount += 1
  }

  if (volatilityShock >= 2.5) {
    accumulator.institutionalEvents
      .volatilityShockCount += 1
  }

  accumulator.sampleCount += 1

  accumulator.oiDeltaAccum += oiDelta

  accumulator.oiExpansionVelocityAccum +=
    oiExpansionVelocity

  accumulator.oiCompressionVelocityAccum +=
    oiCompressionVelocity

  accumulator.oiTrendStrengthAccum +=
    oiTrendStrength

  accumulator.oiDirectionalPersistenceAccum +=
    oiDirectionalPersistence

  accumulator.fundingAccum += fundingRate

  accumulator.fundingMax = Math.max(
    accumulator.fundingMax,
    fundingRate,
  )

  accumulator.fundingMin = Math.min(
    accumulator.fundingMin,
    fundingRate,
  )

  accumulator.volumeRatioAccum += volumeRatio

  if (volumeRatio >= 1.2) {
    accumulator.volumeExpansionCount += 1
  }

  if (volumeRatio <= 0.85) {
    accumulator.volumeWeakCount += 1
  }

  accumulator.whaleIntensityAccum += whaleIntensity

  accumulator.whaleRatioAccum += whaleRatio

  accumulator.whaleNetRatioAccum += whaleNetRatio

  if (whaleNetRatio > 0) {
    accumulator.whaleBuyPressure += whaleNetRatio
  }

  if (whaleNetRatio < 0) {
    accumulator.whaleSellPressure += Math.abs(
      whaleNetRatio,
    )
  }

  accumulator.fmaiAccum += fmai

  accumulator.absorptionAccum += absorption

  accumulator.sweepAccum += sweep

  if (sweep > 0 && whaleNetRatio < 0) {
    accumulator.longLiquidationPressure += Math.abs(
      sweep,
    )
  }

  if (sweep > 0 && whaleNetRatio > 0) {
    accumulator.shortLiquidationPressure += Math.abs(
      sweep,
    )
  }

  try {
    accumulateInstitutionalEvidence1h()
  } catch (error) {
    console.error(
      '[ACCUMULATE_EVIDENCE_1H_ERROR]',
      error,
    )
  }
}

export function freezeInstitutionalSnapshot(
  confirmedCandleTs?: number,
): InstitutionalEvidenceSnapshot {
  console.log(
    '[LOCAL_ACCUMULATOR_30M_FINALIZED_STORE_READ_SKIPPED]',
    {
      ts: Date.now(),
      reason:
        'FINALIZED_30M_STORE_IS_REDIS_API_OWNED',
      confirmedCandleTs,
    },
  )

  if (
    confirmedCandleTs !== undefined &&
    lastFrozenCandleTs === confirmedCandleTs &&
    lastFrozenSnapshot !== null
  ) {
    return lastFrozenSnapshot
  }

  console.log(
    '[FREEZE_INSTITUTIONAL_SNAPSHOT_START]',
    {
      ts: Date.now(),

      confirmedCandleTs,

      sampleCount:
        accumulator.sampleCount,

      oiDeltaAccum:
        accumulator.oiDeltaAccum,

      fundingAccum:
        accumulator.fundingAccum,

      volumeRatioAccum:
        accumulator.volumeRatioAccum,

      whaleIntensityAccum:
        accumulator.whaleIntensityAccum,
    },
  )

  const sampleCount = Math.max(
    accumulator.sampleCount,
    1,
  )

  const oiDeltaAverage =
    accumulator.oiDeltaAccum / sampleCount

  const oiExpansionVelocityAverage =
    accumulator.oiExpansionVelocityAccum /
    sampleCount

  const oiCompressionVelocityAverage =
    accumulator.oiCompressionVelocityAccum /
    sampleCount

  const oiTrendStrengthAverage =
    accumulator.oiTrendStrengthAccum /
    sampleCount

  const oiDirectionalPersistenceAverage =
    accumulator.oiDirectionalPersistenceAccum /
    sampleCount

  const fundingAverage =
    accumulator.fundingAccum / sampleCount

  const volumeRatioAverage =
    accumulator.volumeRatioAccum / sampleCount

  const whaleIntensityAverage =
    accumulator.whaleIntensityAccum / sampleCount

  const whaleRatioAverage =
    accumulator.whaleRatioAccum / sampleCount

  const whaleNetRatioAverage =
    accumulator.whaleNetRatioAccum / sampleCount

  const fmaiAverage =
    accumulator.fmaiAccum / sampleCount

  const absorptionAverage =
    accumulator.absorptionAccum / sampleCount

  const sweepAverage =
    accumulator.sweepAccum / sampleCount

  const dominantFlow =
    accumulator.whaleBuyPressure >
    accumulator.whaleSellPressure
      ? 'LONG'
      : accumulator.whaleSellPressure >
          accumulator.whaleBuyPressure
        ? 'SHORT'
        : 'NEUTRAL'

  const fundingState =
    fundingAverage > 0.0015
      ? 'LONG_OVERHEATED'
      : fundingAverage < -0.0015
        ? 'SHORT_OVERHEATED'
        : 'NEUTRAL'

  const whaleBias =
    accumulator.whaleBuyPressure >
    accumulator.whaleSellPressure * 1.3
      ? 'ACCUMULATION'
      : accumulator.whaleSellPressure >
          accumulator.whaleBuyPressure * 1.3
        ? 'DISTRIBUTION'
        : 'NEUTRAL'

  const volumeState =
    accumulator.volumeExpansionCount >
    accumulator.volumeWeakCount
      ? 'EXPANSION'
      : accumulator.volumeWeakCount >
          accumulator.volumeExpansionCount
        ? 'WEAK'
        : 'NORMAL'

  const divergenceDetected =
    accumulator.oiDeltaAccum > 0 &&
    accumulator.whaleSellPressure >
      accumulator.whaleBuyPressure

  const absorptionDetected =
    Math.abs(accumulator.absorptionAccum) > 0

  const sweepDetected =
    Math.abs(accumulator.sweepAccum) > 0

  const fmaiDirectionalPressure =
    fmaiAverage > 0.15
      ? 'LONG'
      : fmaiAverage < -0.15
        ? 'SHORT'
        : 'NEUTRAL'

  const oiDirectionalPressure =
    oiExpansionVelocityAverage >
      oiCompressionVelocityAverage &&
    oiDirectionalPersistenceAverage >= 0.5
      ? 'LONG'
      : oiCompressionVelocityAverage >
          oiExpansionVelocityAverage &&
        oiDirectionalPersistenceAverage >= 0.5
        ? 'SHORT'
        : 'NEUTRAL'

  const snapshot: InstitutionalEvidenceSnapshot =
    {
      timeframe: '30m',
      confirmedCandleTs:
        confirmedCandleTs ?? Date.now(),

      startTs: accumulator.startTs,
      endTs: Date.now(),

      sampleCount,

      oiDeltaAccum:
        accumulator.oiDeltaAccum,

      oiDeltaAverage,

      oiExpansionVelocityAccum:
        accumulator.oiExpansionVelocityAccum,

      oiExpansionVelocityAverage,

      oiCompressionVelocityAccum:
        accumulator.oiCompressionVelocityAccum,

      oiCompressionVelocityAverage,

      oiTrendStrengthAccum:
        accumulator.oiTrendStrengthAccum,

      oiTrendStrengthAverage,

      oiDirectionalPersistenceAccum:
        accumulator.oiDirectionalPersistenceAccum,

      oiDirectionalPersistenceAverage,

      fundingAccum:
        accumulator.fundingAccum,

      fundingAverage,

      fundingMax:
        accumulator.fundingMax ===
        Number.NEGATIVE_INFINITY
          ? 0
          : accumulator.fundingMax,

      fundingMin:
        accumulator.fundingMin ===
        Number.POSITIVE_INFINITY
          ? 0
          : accumulator.fundingMin,

      volumeRatioAccum:
        accumulator.volumeRatioAccum,

      volumeRatioAverage,

      volumeExpansionCount:
        accumulator.volumeExpansionCount,

      volumeWeakCount:
        accumulator.volumeWeakCount,

      whaleIntensityAccum:
        accumulator.whaleIntensityAccum,

      whaleIntensityAverage,

      whaleRatioAccum:
        accumulator.whaleRatioAccum,

      whaleRatioAverage,

      whaleNetRatioAccum:
        accumulator.whaleNetRatioAccum,

      whaleNetRatioAverage,

      whaleBuyPressure:
        accumulator.whaleBuyPressure,

      whaleSellPressure:
        accumulator.whaleSellPressure,

      fmaiAccum:
        accumulator.fmaiAccum,

      fmaiAverage,

      absorptionAccum:
        accumulator.absorptionAccum,

      absorptionAverage,

      sweepAccum:
        accumulator.sweepAccum,

      sweepAverage,

      longLiquidationPressure:
        accumulator.longLiquidationPressure,

      shortLiquidationPressure:
        accumulator.shortLiquidationPressure,

      dominantFlow,

      fundingState,

      whaleBias,

      volumeState,

      divergenceDetected,
      absorptionDetected,
      sweepDetected,

      fmaiDirectionalPressure,
      oiDirectionalPressure,

      institutionalEvents: {
        whaleBurstCount:
          accumulator.institutionalEvents
            .whaleBurstCount,

        longAggressionDuration:
          accumulator.institutionalEvents
            .longAggressionDuration,

        shortAggressionDuration:
          accumulator.institutionalEvents
            .shortAggressionDuration,

        longAggressionPersistence:
          accumulator.institutionalEvents
            .longAggressionPersistence,

        shortAggressionPersistence:
          accumulator.institutionalEvents
            .shortAggressionPersistence,

        fundingOverheatDuration:
          accumulator.institutionalEvents
            .fundingOverheatDuration,

        oiExpansionEventCount:
          accumulator.institutionalEvents
            .oiExpansionEventCount,

        whaleAbsorptionCount:
          accumulator.institutionalEvents
            .whaleAbsorptionCount,

        liquiditySweepCount:
          accumulator.institutionalEvents
            .liquiditySweepCount,

        volatilityShockCount:
          accumulator.institutionalEvents
            .volatilityShockCount,
      },
    }

  lastFrozenSnapshot = snapshot
  lastFrozenCandleTs = snapshot.confirmedCandleTs

  console.log(
    '[FREEZE_INSTITUTIONAL_SNAPSHOT_CREATED]',
    {
      ts: Date.now(),

      snapshotConfirmedCandleTs:
        snapshot.confirmedCandleTs,

      sampleCount:
        snapshot.sampleCount,

      oiDeltaAccum:
        snapshot.oiDeltaAccum,

      fundingAccum:
        snapshot.fundingAccum,

      volumeRatioAccum:
        snapshot.volumeRatioAccum,

      whaleIntensityAccum:
        snapshot.whaleIntensityAccum,
    },
  )

  void saveFinalized30mSnapshotViaRoute(snapshot)

  let finalizedSnapshot1hForEmit:
    | InstitutionalEvidenceSnapshot1h
    | null = null

  if (
    new Date(
      snapshot.confirmedCandleTs,
    ).getUTCMinutes() === 0
  ) {
    try {
      finalizedSnapshot1hForEmit =
        freezeInstitutionalSnapshot1h(
          snapshot.confirmedCandleTs,
        )
    } catch (error) {
      console.error(
        '[FREEZE_INSTITUTIONAL_SNAPSHOT_1H_ERROR]',
        {
          confirmedCandleTs:
            snapshot.confirmedCandleTs,
          error,
        },
      )
    }
  }

  emitInstitutionalPatternSignal(
    snapshot,
    finalizedSnapshot1hForEmit,
  )

  console.log(
    '[ACCUMULATOR_RESET]',
    {
      ts: Date.now(),

      beforeResetSampleCount:
        accumulator.sampleCount,

      confirmedCandleTs:
        snapshot.confirmedCandleTs,
    },
  )

  accumulator = createEmptyAccumulator()

  return snapshot
}
