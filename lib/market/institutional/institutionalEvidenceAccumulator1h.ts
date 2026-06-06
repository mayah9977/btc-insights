// lib/market/institutional/institutionalEvidenceAccumulator1h.ts

import { getMarketSnapshot } from '@/lib/market/engine/marketSnapshot'

import {
  useInstitutionalEvidenceStore1h,
} from '@/lib/market/institutional/institutionalEvidenceStore1h'

import type {
  InstitutionalEvidenceSnapshot1h,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot1h'

type InternalAccumulator1h = {
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
}

let accumulator1h: InternalAccumulator1h =
  createEmptyAccumulator1h()

let lastFrozenSnapshot1h:
  | InstitutionalEvidenceSnapshot1h
  | null = null

let lastFrozenCandleTs1h: number | null = null

function createEmptyAccumulator1h(): InternalAccumulator1h {
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
  }
}

export function accumulateInstitutionalEvidence1h() {
  const beforeSampleCount =
    accumulator1h.sampleCount

  const snapshot =
    getMarketSnapshot()

  console.log(
    '[ACCUMULATE_EVIDENCE_1H_CALL]',
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

  const oiDelta =
    Number(snapshot.oiDelta ?? 0)

  const oiExpansionVelocity =
    Number(
      (snapshot as any)
        .oiExpansionVelocity ?? 0,
    )

  const oiCompressionVelocity =
    Number(
      (snapshot as any)
        .oiCompressionVelocity ?? 0,
    )

  const oiTrendStrength =
    Number(
      (snapshot as any)
        .oiTrendStrength ?? 0,
    )

  const oiDirectionalPersistence =
    Number(
      (snapshot as any)
        .oiDirectionalPersistence ?? 0,
    )

  const volumeRatio =
    Number(snapshot.volumeRatio ?? 1)

  const fundingRate =
    Number(snapshot.fundingRate ?? 0)

  const whaleIntensity =
    Number(snapshot.whaleIntensity ?? 0)

  const whaleNetRatio =
    Number(snapshot.whaleNetRatio ?? 0)

  const whaleRatio =
    Number(snapshot.whaleRatio ?? 0)

  const fmai =
    Number((snapshot as any).fmai ?? 0)

  const absorption =
    Number((snapshot as any).absorption ?? 0)

  const sweep =
    Number((snapshot as any).sweep ?? 0)

  accumulator1h.sampleCount += 1

  accumulator1h.oiDeltaAccum += oiDelta

  accumulator1h.oiExpansionVelocityAccum +=
    oiExpansionVelocity

  accumulator1h.oiCompressionVelocityAccum +=
    oiCompressionVelocity

  accumulator1h.oiTrendStrengthAccum +=
    oiTrendStrength

  accumulator1h.oiDirectionalPersistenceAccum +=
    oiDirectionalPersistence

  accumulator1h.fundingAccum += fundingRate

  accumulator1h.fundingMax = Math.max(
    accumulator1h.fundingMax,
    fundingRate,
  )

  accumulator1h.fundingMin = Math.min(
    accumulator1h.fundingMin,
    fundingRate,
  )

  accumulator1h.volumeRatioAccum += volumeRatio

  if (volumeRatio >= 1.2) {
    accumulator1h.volumeExpansionCount += 1
  }

  if (volumeRatio <= 0.85) {
    accumulator1h.volumeWeakCount += 1
  }

  accumulator1h.whaleIntensityAccum +=
    whaleIntensity

  accumulator1h.whaleRatioAccum +=
    whaleRatio

  accumulator1h.whaleNetRatioAccum +=
    whaleNetRatio

  if (whaleNetRatio > 0) {
    accumulator1h.whaleBuyPressure +=
      whaleNetRatio
  }

  if (whaleNetRatio < 0) {
    accumulator1h.whaleSellPressure +=
      Math.abs(whaleNetRatio)
  }

  accumulator1h.fmaiAccum += fmai

  accumulator1h.absorptionAccum +=
    absorption

  accumulator1h.sweepAccum += sweep

  if (sweep > 0 && whaleNetRatio < 0) {
    accumulator1h.longLiquidationPressure +=
      Math.abs(sweep)
  }

  if (sweep > 0 && whaleNetRatio > 0) {
    accumulator1h.shortLiquidationPressure +=
      Math.abs(sweep)
  }

  console.log(
    '[ACCUMULATE_EVIDENCE_1H_UPDATED]',
    {
      ts: Date.now(),

      sampleCountBefore:
        beforeSampleCount,

      sampleCountAfter:
        accumulator1h.sampleCount,

      oiDeltaAccum:
        accumulator1h.oiDeltaAccum,

      fundingAccum:
        accumulator1h.fundingAccum,

      volumeRatioAccum:
        accumulator1h.volumeRatioAccum,

      whaleIntensityAccum:
        accumulator1h.whaleIntensityAccum,
    },
  )
}

export function freezeInstitutionalSnapshot1h(
  confirmedCandleTs?: number,
): InstitutionalEvidenceSnapshot1h {
  const persistedSnapshot =
    useInstitutionalEvidenceStore1h
      .getState()
      .snapshot

  if (
    confirmedCandleTs !== undefined &&
    persistedSnapshot !== null &&
    persistedSnapshot.confirmedCandleTs ===
      confirmedCandleTs
  ) {
    lastFrozenSnapshot1h =
      persistedSnapshot

    lastFrozenCandleTs1h =
      persistedSnapshot.confirmedCandleTs

    return persistedSnapshot
  }

  if (
    confirmedCandleTs !== undefined &&
    lastFrozenCandleTs1h ===
      confirmedCandleTs &&
    lastFrozenSnapshot1h !== null
  ) {
    return lastFrozenSnapshot1h
  }

  console.log(
    '[FREEZE_INSTITUTIONAL_SNAPSHOT_1H_START]',
    {
      ts: Date.now(),

      confirmedCandleTs,

      sampleCount:
        accumulator1h.sampleCount,

      oiDeltaAccum:
        accumulator1h.oiDeltaAccum,

      fundingAccum:
        accumulator1h.fundingAccum,

      volumeRatioAccum:
        accumulator1h.volumeRatioAccum,

      whaleIntensityAccum:
        accumulator1h.whaleIntensityAccum,
    },
  )

  const sampleCount =
    Math.max(
      accumulator1h.sampleCount,
      1,
    )

  const oiDeltaAverage =
    accumulator1h.oiDeltaAccum /
    sampleCount

  const oiExpansionVelocityAverage =
    accumulator1h.oiExpansionVelocityAccum /
    sampleCount

  const oiCompressionVelocityAverage =
    accumulator1h.oiCompressionVelocityAccum /
    sampleCount

  const oiTrendStrengthAverage =
    accumulator1h.oiTrendStrengthAccum /
    sampleCount

  const oiDirectionalPersistenceAverage =
    accumulator1h
      .oiDirectionalPersistenceAccum /
    sampleCount

  const fundingAverage =
    accumulator1h.fundingAccum /
    sampleCount

  const volumeRatioAverage =
    accumulator1h.volumeRatioAccum /
    sampleCount

  const whaleIntensityAverage =
    accumulator1h.whaleIntensityAccum /
    sampleCount

  const whaleRatioAverage =
    accumulator1h.whaleRatioAccum /
    sampleCount

  const whaleNetRatioAverage =
    accumulator1h.whaleNetRatioAccum /
    sampleCount

  const fmaiAverage =
    accumulator1h.fmaiAccum /
    sampleCount

  const absorptionAverage =
    accumulator1h.absorptionAccum /
    sampleCount

  const sweepAverage =
    accumulator1h.sweepAccum /
    sampleCount

  const dominantFlow =
    accumulator1h.whaleBuyPressure >
    accumulator1h.whaleSellPressure
      ? 'LONG'
      : accumulator1h.whaleSellPressure >
          accumulator1h.whaleBuyPressure
        ? 'SHORT'
        : 'NEUTRAL'

  const fundingState =
    fundingAverage > 0.0015
      ? 'LONG_OVERHEATED'
      : fundingAverage < -0.0015
        ? 'SHORT_OVERHEATED'
        : 'NEUTRAL'

  const whaleBias =
    accumulator1h.whaleBuyPressure >
    accumulator1h.whaleSellPressure * 1.3
      ? 'ACCUMULATION'
      : accumulator1h.whaleSellPressure >
          accumulator1h.whaleBuyPressure * 1.3
        ? 'DISTRIBUTION'
        : 'NEUTRAL'

  const volumeState =
    accumulator1h.volumeExpansionCount >
    accumulator1h.volumeWeakCount
      ? 'EXPANSION'
      : accumulator1h.volumeWeakCount >
          accumulator1h.volumeExpansionCount
        ? 'WEAK'
        : 'NORMAL'

  const divergenceDetected =
    accumulator1h.oiDeltaAccum > 0 &&
    accumulator1h.whaleSellPressure >
      accumulator1h.whaleBuyPressure

  const absorptionDetected =
    Math.abs(
      accumulator1h.absorptionAccum,
    ) > 0

  const sweepDetected =
    Math.abs(accumulator1h.sweepAccum) > 0

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

  const snapshot: InstitutionalEvidenceSnapshot1h =
    {
      timeframe: '1h',

      confirmedCandleTs:
        confirmedCandleTs ?? Date.now(),

      startTs:
        accumulator1h.startTs,

      endTs:
        Date.now(),

      sampleCount,

      oiDeltaAccum:
        accumulator1h.oiDeltaAccum,

      oiDeltaAverage,

      oiExpansionVelocityAccum:
        accumulator1h
          .oiExpansionVelocityAccum,

      oiExpansionVelocityAverage,

      oiCompressionVelocityAccum:
        accumulator1h
          .oiCompressionVelocityAccum,

      oiCompressionVelocityAverage,

      oiTrendStrengthAccum:
        accumulator1h
          .oiTrendStrengthAccum,

      oiTrendStrengthAverage,

      oiDirectionalPersistenceAccum:
        accumulator1h
          .oiDirectionalPersistenceAccum,

      oiDirectionalPersistenceAverage,

      fundingAccum:
        accumulator1h.fundingAccum,

      fundingAverage,

      fundingMax:
        accumulator1h.fundingMax ===
        Number.NEGATIVE_INFINITY
          ? 0
          : accumulator1h.fundingMax,

      fundingMin:
        accumulator1h.fundingMin ===
        Number.POSITIVE_INFINITY
          ? 0
          : accumulator1h.fundingMin,

      volumeRatioAccum:
        accumulator1h.volumeRatioAccum,

      volumeRatioAverage,

      volumeExpansionCount:
        accumulator1h.volumeExpansionCount,

      volumeWeakCount:
        accumulator1h.volumeWeakCount,

      whaleIntensityAccum:
        accumulator1h.whaleIntensityAccum,

      whaleIntensityAverage,

      whaleRatioAccum:
        accumulator1h.whaleRatioAccum,

      whaleRatioAverage,

      whaleNetRatioAccum:
        accumulator1h.whaleNetRatioAccum,

      whaleNetRatioAverage,

      whaleBuyPressure:
        accumulator1h.whaleBuyPressure,

      whaleSellPressure:
        accumulator1h.whaleSellPressure,

      fmaiAccum:
        accumulator1h.fmaiAccum,

      fmaiAverage,

      absorptionAccum:
        accumulator1h.absorptionAccum,

      absorptionAverage,

      sweepAccum:
        accumulator1h.sweepAccum,

      sweepAverage,

      longLiquidationPressure:
        accumulator1h.longLiquidationPressure,

      shortLiquidationPressure:
        accumulator1h.shortLiquidationPressure,

      dominantFlow,

      fundingState,

      whaleBias,

      volumeState,

      divergenceDetected,

      absorptionDetected,

      sweepDetected,

      fmaiDirectionalPressure,

      oiDirectionalPressure,
    }

  useInstitutionalEvidenceStore1h
    .getState()
    .setSnapshot(snapshot)

  lastFrozenSnapshot1h =
    snapshot

  lastFrozenCandleTs1h =
    snapshot.confirmedCandleTs

  console.log(
    '[FREEZE_INSTITUTIONAL_SNAPSHOT_1H_CREATED]',
    {
      ts: Date.now(),

      confirmedCandleTs:
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

      dominantFlow:
        snapshot.dominantFlow,

      fundingState:
        snapshot.fundingState,

      whaleBias:
        snapshot.whaleBias,

      volumeState:
        snapshot.volumeState,

      oiDirectionalPressure:
        snapshot.oiDirectionalPressure,

      fmaiDirectionalPressure:
        snapshot.fmaiDirectionalPressure,
    },
  )

  accumulator1h =
    createEmptyAccumulator1h()

  return snapshot
}
