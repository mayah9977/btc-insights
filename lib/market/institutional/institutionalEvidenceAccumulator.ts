// lib/market/institutional/institutionalEvidenceAccumulator.ts

import { getMarketSnapshot } from '@/lib/market/engine/marketSnapshot'

import { useInstitutionalEvidenceStore } from '@/lib/market/institutional/institutionalEvidenceStore'

import type {
  InstitutionalEvidenceSnapshot,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot'

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

let accumulator: InternalAccumulator =
  createEmptyAccumulator()

let lastFrozenSnapshot:
  | InstitutionalEvidenceSnapshot
  | null = null

let lastFrozenCandleTs: number | null = null

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

/* =========================================================
   Realtime Aggregation
   - SSE → VIPMarketStore → getMarketSnapshot 이후 호출
   - vipMarketStore에서 30초 throttle로만 호출
   - 순간값 narrative 방지
   - 30분 confirmed freeze 전까지 누적
========================================================= */

export function accumulateInstitutionalEvidence() {
  const beforeSampleCount =
    accumulator.sampleCount

  const snapshot = getMarketSnapshot()

  console.log(
    '[ACCUMULATE_EVIDENCE_CALL]',
    {
      ts: Date.now(),

      sampleCountBefore:
        beforeSampleCount,

      triggerSource:
        'scheduleVIPMarketUpdate',

      marketSnapshotTs:
        snapshot.ts,
    },
  )

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

  /* =========================================================
     Institutional Event Detection
     - Narrative memory only
     - Decision authority ❌
     - ENUM / ActionGate / DecisionEngine 영향 없음
  ========================================================= */

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

  console.log(
    '[ACCUMULATE_EVIDENCE_CALL]',
    {
      ts: Date.now(),

      sampleCountBefore:
        beforeSampleCount,

      sampleCountAfter:
        accumulator.sampleCount,

      triggerSource:
        'scheduleVIPMarketUpdate',

      marketSnapshotTs:
        snapshot.ts,
    },
  )

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
}

/* =========================================================
   Freeze Snapshot
   - 30m Bollinger confirmed 시점에서만 실행
   - freeze 이후 accumulator reset
   - ENUM 변경/override 없음
========================================================= */

export function freezeInstitutionalSnapshot(
  confirmedCandleTs?: number,
): InstitutionalEvidenceSnapshot {
  const persistedSnapshot =
    useInstitutionalEvidenceStore.getState().snapshot

  if (
    confirmedCandleTs !== undefined &&
    persistedSnapshot !== null &&
    persistedSnapshot.confirmedCandleTs ===
      confirmedCandleTs
  ) {
    lastFrozenSnapshot = persistedSnapshot
    lastFrozenCandleTs =
      persistedSnapshot.confirmedCandleTs

    return persistedSnapshot
  }

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
      /**
       * 🔥 freeze metadata
       */
      timeframe: '30m',
      confirmedCandleTs:
        confirmedCandleTs ?? Date.now(),

      startTs: accumulator.startTs,
      endTs: Date.now(),

      sampleCount,

      oiDeltaAccum:
        accumulator.oiDeltaAccum,

      oiDeltaAverage,

      /**
       * 🔥 OI velocity layer
       */
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
