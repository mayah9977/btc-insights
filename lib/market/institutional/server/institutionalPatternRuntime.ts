// lib/market/institutional/server/institutionalPatternRuntime.ts

import {
  createInstitutionalEvidenceSample,
  type InstitutionalEvidenceSample,
} from './institutionalEvidenceSample'

import type {
  InstitutionalEvidenceSnapshot,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot'

import type {
  InstitutionalEvidenceSnapshot1h,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot1h'

import {
  detectInstitutionalPattern,
} from '@/lib/market/patterns/detectInstitutionalPattern'

import {
  buildInstitutionalConfirmation1h,
} from '@/lib/market/institutional/buildInstitutionalConfirmation1h'

import {
  isInstitutionalReadyPatternPresentation,
  type InstitutionalReadyPatternPresentation,
} from '@/lib/market/institutional/institutionalLatestEvaluation'

const INSTITUTIONAL_EVIDENCE_SAMPLE_INTERVAL_MS =
  30_000

/**
 * Latest values produced by the existing server-side realtime calculation
 * path.
 *
 * All numeric values must already use the browser-compatible unit, scale,
 * and sign contract before they enter this module.
 *
 * This module does not clamp, normalize, scale, infer a direction, or provide
 * fallback values.
 */
export type InstitutionalPatternLatestInput = Readonly<{
  oiDelta: number

  volumeRatio: number
  fundingRate: number

  whaleIntensity: number
  whaleNetRatio: number
  whaleRatio: number

  /**
   * Original FMAI score unit.
   */
  fmai: number

  /**
   * Signed absorption value already converted upstream to the same numeric
   * contract used by the browser path.
   */
  absorption: number

  /**
   * Raw liquidity-sweep strength.
   *
   * The value must not be made positive or negative based on SWEEP_UP or
   * SWEEP_DOWN. Direction-based sign conversion is prohibited.
   */
  sweep: number
}>

type InstitutionalOIDerivedState = {
  previousOiDelta: number

  oiExpansionVelocity: number
  oiCompressionVelocity: number
  oiTrendStrength: number

  oiDirectionalPersistenceCount: number
  oiDirectionalPersistence: number
}

type InstitutionalEventsAccumulator30m = {
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

type InstitutionalEvidenceAccumulatorBase = {
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

type InstitutionalEvidenceAccumulator30m =
  InstitutionalEvidenceAccumulatorBase & {
    institutionalEvents:
      InstitutionalEventsAccumulator30m
  }

type InstitutionalEvidenceAccumulator1h =
  InstitutionalEvidenceAccumulatorBase

type InstitutionalPatternRuntimeState = {
  latestInput: InstitutionalPatternLatestInput | null

  /**
   * Increases only when at least one field in latestInput actually changes.
   */
  revision: number

  /**
   * Revision for which the OI-derived state was last evaluated.
   */
  oiDerivedRevision: number

  oiDerived: InstitutionalOIDerivedState

  accumulator30m: InstitutionalEvidenceAccumulator30m
  accumulator1h: InstitutionalEvidenceAccumulator1h

  lastFrozenSnapshot30m:
    | InstitutionalEvidenceSnapshot
    | null
  lastFrozenCandleTs30m: number | null

  lastFrozenSnapshot1h:
    | InstitutionalEvidenceSnapshot1h
    | null
  lastFrozenCandleTs1h: number | null

  /**
   * Actual execution timestamp of the last successfully created evidence
   * sample.
   *
   * A value of 0 means no sample has been created yet.
   */
  lastSampleAt: number
}

export type UpdateInstitutionalPatternLatestStateResult =
  Readonly<{
    changed: boolean
    revision: number
  }>

export type SampleInstitutionalEvidenceResult =
  | Readonly<{
      sampled: false
      reason: 'LATEST_INPUT_NOT_READY' | 'THROTTLED'
      sample: null
      nextSampleAt: number | null
    }>
  | Readonly<{
      sampled: true
      reason: 'SAMPLED'
      sample: InstitutionalEvidenceSample
      nextSampleAt: number
    }>

export type InstitutionalPatternEvaluationResult =
  | Readonly<{
      status: 'NO_PATTERN'
      confirmedCandleTs: number
      snapshot30m: InstitutionalEvidenceSnapshot
      snapshot1h: InstitutionalEvidenceSnapshot1h | null
      detectedPattern: ReturnType<
        typeof detectInstitutionalPattern
      >
      confirmation1h: null
    }>
  | Readonly<{
      status: 'BLOCKED_BY_1H'
      confirmedCandleTs: number
      snapshot30m: InstitutionalEvidenceSnapshot
      snapshot1h: InstitutionalEvidenceSnapshot1h | null
      detectedPattern: ReturnType<
        typeof detectInstitutionalPattern
      >
      confirmation1h: ReturnType<
        typeof buildInstitutionalConfirmation1h
      >
    }>
  | Readonly<{
      status: 'READY'
      confirmedCandleTs: number
      snapshot30m: InstitutionalEvidenceSnapshot
      snapshot1h: InstitutionalEvidenceSnapshot1h | null
      detectedPattern:
        InstitutionalReadyPatternPresentation
      confirmation1h: ReturnType<
        typeof buildInstitutionalConfirmation1h
      >
    }>

/**
 * The only module-level mutable state in this module.
 *
 * Each symbol owns an independent latest-input state, OI-derived state,
 * revision, accumulators, frozen snapshots, and 30-second sampling clock.
 */
const runtimeStateBySymbol =
  new Map<string, InstitutionalPatternRuntimeState>()

function createEmptyInstitutionalEvidenceAccumulatorBase():
  InstitutionalEvidenceAccumulatorBase {
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

function createEmptyInstitutionalEventsAccumulator30m():
  InstitutionalEventsAccumulator30m {
  return {
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
  }
}

function createEmptyInstitutionalEvidenceAccumulator30m():
  InstitutionalEvidenceAccumulator30m {
  return {
    ...createEmptyInstitutionalEvidenceAccumulatorBase(),
    institutionalEvents:
      createEmptyInstitutionalEventsAccumulator30m(),
  }
}

function createEmptyInstitutionalEvidenceAccumulator1h():
  InstitutionalEvidenceAccumulator1h {
  return {
    ...createEmptyInstitutionalEvidenceAccumulatorBase(),
  }
}

function createInitialRuntimeState():
  InstitutionalPatternRuntimeState {
  return {
    latestInput: null,

    revision: 0,
    oiDerivedRevision: 0,

    oiDerived: {
      previousOiDelta: 0,

      oiExpansionVelocity: 0,
      oiCompressionVelocity: 0,
      oiTrendStrength: 0,

      oiDirectionalPersistenceCount: 0,
      oiDirectionalPersistence: 0,
    },

    accumulator30m:
      createEmptyInstitutionalEvidenceAccumulator30m(),
    accumulator1h:
      createEmptyInstitutionalEvidenceAccumulator1h(),

    lastFrozenSnapshot30m: null,
    lastFrozenCandleTs30m: null,

    lastFrozenSnapshot1h: null,
    lastFrozenCandleTs1h: null,

    lastSampleAt: 0,
  }
}

function getOrCreateRuntimeState(
  symbol: string,
): InstitutionalPatternRuntimeState {
  const existing =
    runtimeStateBySymbol.get(symbol)

  if (existing) {
    return existing
  }

  const created =
    createInitialRuntimeState()

  runtimeStateBySymbol.set(
    symbol,
    created,
  )

  return created
}

export function hydrateInstitutionalPattern1hSnapshot(
  symbol: string,
  snapshot: InstitutionalEvidenceSnapshot1h,
): void {
  if (
    snapshot.timeframe !== '1h' ||
    !Number.isFinite(
      snapshot.confirmedCandleTs,
    )
  ) {
    return
  }

  const state =
    getOrCreateRuntimeState(symbol)

  if (
    state.lastFrozenCandleTs1h !== null &&
    state.lastFrozenCandleTs1h >
      snapshot.confirmedCandleTs
  ) {
    return
  }

  state.lastFrozenSnapshot1h =
    snapshot

  state.lastFrozenCandleTs1h =
    snapshot.confirmedCandleTs
}

function hasLatestInputChanged(
  previous: InstitutionalPatternLatestInput | null,
  next: InstitutionalPatternLatestInput,
): boolean {
  if (previous === null) {
    return true
  }

  return (
    previous.oiDelta !== next.oiDelta ||
    previous.volumeRatio !== next.volumeRatio ||
    previous.fundingRate !== next.fundingRate ||
    previous.whaleIntensity !== next.whaleIntensity ||
    previous.whaleNetRatio !== next.whaleNetRatio ||
    previous.whaleRatio !== next.whaleRatio ||
    previous.fmai !== next.fmai ||
    previous.absorption !== next.absorption ||
    previous.sweep !== next.sweep
  )
}

/**
 * Re-evaluates the OI-derived values once for each changed latest-input
 * revision.
 *
 * This follows the confirmed browser calculation contract:
 *
 * velocity =
 *   current oiDelta - previous oiDelta
 *
 * expansion velocity =
 *   positive velocity, otherwise 0
 *
 * compression velocity =
 *   absolute value of negative velocity, otherwise 0
 *
 * trend strength =
 *   min(abs(current oiDelta) * 1000, 100)
 *
 * directional persistence:
 *   increase the count when current and previous OI delta signs match;
 *   otherwise reset the count to 0
 *
 * persistence =
 *   min(count / 10, 1)
 */
function evaluateOIDerivedState(
  state: InstitutionalPatternRuntimeState,
): void {
  const latestInput =
    state.latestInput

  if (latestInput === null) {
    return
  }

  if (
    state.oiDerivedRevision ===
    state.revision
  ) {
    return
  }

  const currentOiDelta =
    latestInput.oiDelta

  const previousOiDelta =
    state.oiDerived.previousOiDelta

  const oiVelocity =
    currentOiDelta - previousOiDelta

  const oiExpansionVelocity =
    oiVelocity > 0
      ? oiVelocity
      : 0

  const oiCompressionVelocity =
    oiVelocity < 0
      ? Math.abs(oiVelocity)
      : 0

  const oiTrendStrength =
    Math.min(
      Math.abs(currentOiDelta) * 1000,
      100,
    )

  const sameDirection =
    (
      currentOiDelta >= 0 &&
      previousOiDelta >= 0
    ) ||
    (
      currentOiDelta <= 0 &&
      previousOiDelta <= 0
    )

  const oiDirectionalPersistenceCount =
    sameDirection
      ? (
          state.oiDerived
            .oiDirectionalPersistenceCount +
          1
        )
      : 0

  const oiDirectionalPersistence =
    Math.min(
      oiDirectionalPersistenceCount / 10,
      1,
    )

  state.oiDerived = {
    previousOiDelta:
      currentOiDelta,

    oiExpansionVelocity,
    oiCompressionVelocity,
    oiTrendStrength,

    oiDirectionalPersistenceCount,
    oiDirectionalPersistence,
  }

  state.oiDerivedRevision =
    state.revision
}

/**
 * Updates only the latest server-side institutional input state.
 *
 * Calling this function once per second does not create an evidence sample
 * and does not modify any future 30-minute or 1-hour accumulator.
 *
 * The internal revision changes only when at least one input value actually
 * differs from the previously stored input.
 *
 * When any valid input field changes, the browser-compatible OI-derived
 * values are re-evaluated even if oiDelta itself did not change. When the
 * complete input is unchanged, the revision does not change and OI
 * persistence is not increased.
 */
export function updateInstitutionalPatternLatestState(
  symbol: string,
  input: InstitutionalPatternLatestInput,
): UpdateInstitutionalPatternLatestStateResult {
  const state =
    getOrCreateRuntimeState(symbol)

  if (
    !hasLatestInputChanged(
      state.latestInput,
      input,
    )
  ) {
    return Object.freeze({
      changed: false,
      revision: state.revision,
    })
  }

  state.latestInput =
    Object.freeze({
      oiDelta: input.oiDelta,

      volumeRatio: input.volumeRatio,
      fundingRate: input.fundingRate,

      whaleIntensity:
        input.whaleIntensity,
      whaleNetRatio:
        input.whaleNetRatio,
      whaleRatio:
        input.whaleRatio,

      fmai: input.fmai,
      absorption: input.absorption,
      sweep: input.sweep,
    })

  state.revision += 1

  evaluateOIDerivedState(state)

  return Object.freeze({
    changed: true,
    revision: state.revision,
  })
}

function accumulateInstitutionalEvidenceBase(
  accumulator: InstitutionalEvidenceAccumulatorBase,
  sample: InstitutionalEvidenceSample,
): void {
  accumulator.sampleCount += 1

  accumulator.oiDeltaAccum +=
    sample.oiDelta

  accumulator.oiExpansionVelocityAccum +=
    sample.oiExpansionVelocity

  accumulator.oiCompressionVelocityAccum +=
    sample.oiCompressionVelocity

  accumulator.oiTrendStrengthAccum +=
    sample.oiTrendStrength

  accumulator.oiDirectionalPersistenceAccum +=
    sample.oiDirectionalPersistence

  accumulator.fundingAccum +=
    sample.fundingRate

  accumulator.fundingMax =
    Math.max(
      accumulator.fundingMax,
      sample.fundingRate,
    )

  accumulator.fundingMin =
    Math.min(
      accumulator.fundingMin,
      sample.fundingRate,
    )

  accumulator.volumeRatioAccum +=
    sample.volumeRatio

  if (sample.volumeRatio >= 1.2) {
    accumulator.volumeExpansionCount += 1
  }

  if (sample.volumeRatio <= 0.85) {
    accumulator.volumeWeakCount += 1
  }

  accumulator.whaleIntensityAccum +=
    sample.whaleIntensity

  accumulator.whaleRatioAccum +=
    sample.whaleRatio

  accumulator.whaleNetRatioAccum +=
    sample.whaleNetRatio

  if (sample.whaleNetRatio > 0) {
    accumulator.whaleBuyPressure +=
      sample.whaleNetRatio
  }

  if (sample.whaleNetRatio < 0) {
    accumulator.whaleSellPressure +=
      Math.abs(sample.whaleNetRatio)
  }

  accumulator.fmaiAccum +=
    sample.fmai

  accumulator.absorptionAccum +=
    sample.absorption

  accumulator.sweepAccum +=
    sample.sweep

  if (
    sample.sweep > 0 &&
    sample.whaleNetRatio < 0
  ) {
    accumulator.longLiquidationPressure +=
      Math.abs(sample.sweep)
  }

  if (
    sample.sweep > 0 &&
    sample.whaleNetRatio > 0
  ) {
    accumulator.shortLiquidationPressure +=
      Math.abs(sample.sweep)
  }
}

export function accumulateInstitutionalEvidence30mServer(
  symbol: string,
  sample: InstitutionalEvidenceSample,
): void {
  const state =
    getOrCreateRuntimeState(symbol)

  const accumulator =
    state.accumulator30m

  if (
    sample.whaleIntensity >= 80 &&
    sample.whaleRatio >= 0.35
  ) {
    accumulator.institutionalEvents
      .whaleBurstCount += 1
  }

  if (
    sample.whaleNetRatio >= 0.18 &&
    sample.oiDelta > 0 &&
    sample.whaleIntensity >= 60
  ) {
    accumulator.institutionalEvents
      .longAggressionDuration += 30

    accumulator.institutionalEvents
      .longAggressionPersistence += 1
  }

  if (
    sample.whaleNetRatio <= -0.18 &&
    sample.oiDelta < 0 &&
    sample.whaleIntensity >= 60
  ) {
    accumulator.institutionalEvents
      .shortAggressionDuration += 30

    accumulator.institutionalEvents
      .shortAggressionPersistence += 1
  }

  if (
    Math.abs(sample.fundingRate) >=
    0.0015
  ) {
    accumulator.institutionalEvents
      .fundingOverheatDuration += 30
  }

  if (
    sample.oiExpansionVelocity >= 0.25 &&
    sample.oiTrendStrength >= 40
  ) {
    accumulator.institutionalEvents
      .oiExpansionEventCount += 1
  }

  if (
    Math.abs(sample.absorption) >= 0.6
  ) {
    accumulator.institutionalEvents
      .whaleAbsorptionCount += 1
  }

  if (
    Math.abs(sample.sweep) >= 0.6
  ) {
    accumulator.institutionalEvents
      .liquiditySweepCount += 1
  }

  if (
    sample.volatilityShock >= 2.5
  ) {
    accumulator.institutionalEvents
      .volatilityShockCount += 1
  }

  accumulateInstitutionalEvidenceBase(
    accumulator,
    sample,
  )
}

export function accumulateInstitutionalEvidence1hServer(
  symbol: string,
  sample: InstitutionalEvidenceSample,
): void {
  const state =
    getOrCreateRuntimeState(symbol)

  accumulateInstitutionalEvidenceBase(
    state.accumulator1h,
    sample,
  )
}

export function freezeInstitutionalEvidence30mServer(
  symbol: string,
  confirmedCandleTs: number,
): InstitutionalEvidenceSnapshot {
  const state =
    getOrCreateRuntimeState(symbol)

  if (
    state.lastFrozenCandleTs30m ===
      confirmedCandleTs &&
    state.lastFrozenSnapshot30m !== null
  ) {
    return state.lastFrozenSnapshot30m
  }

  const accumulator =
    state.accumulator30m

  const sampleCount =
    Math.max(
      accumulator.sampleCount,
      1,
    )

  const oiDeltaAverage =
    accumulator.oiDeltaAccum /
    sampleCount

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
    accumulator
      .oiDirectionalPersistenceAccum /
    sampleCount

  const fundingAverage =
    accumulator.fundingAccum /
    sampleCount

  const volumeRatioAverage =
    accumulator.volumeRatioAccum /
    sampleCount

  const whaleIntensityAverage =
    accumulator.whaleIntensityAccum /
    sampleCount

  const whaleRatioAverage =
    accumulator.whaleRatioAccum /
    sampleCount

  const whaleNetRatioAverage =
    accumulator.whaleNetRatioAccum /
    sampleCount

  const fmaiAverage =
    accumulator.fmaiAccum /
    sampleCount

  const absorptionAverage =
    accumulator.absorptionAccum /
    sampleCount

  const sweepAverage =
    accumulator.sweepAccum /
    sampleCount

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
    Math.abs(
      accumulator.absorptionAccum,
    ) > 0

  const sweepDetected =
    Math.abs(
      accumulator.sweepAccum,
    ) > 0

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

  const snapshot:
    InstitutionalEvidenceSnapshot = {
      timeframe: '30m',

      confirmedCandleTs,

      startTs:
        accumulator.startTs,

      endTs:
        Date.now(),

      sampleCount,

      oiDeltaAccum:
        accumulator.oiDeltaAccum,

      oiDeltaAverage,

      oiExpansionVelocityAccum:
        accumulator
          .oiExpansionVelocityAccum,

      oiExpansionVelocityAverage,

      oiCompressionVelocityAccum:
        accumulator
          .oiCompressionVelocityAccum,

      oiCompressionVelocityAverage,

      oiTrendStrengthAccum:
        accumulator
          .oiTrendStrengthAccum,

      oiTrendStrengthAverage,

      oiDirectionalPersistenceAccum:
        accumulator
          .oiDirectionalPersistenceAccum,

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
        accumulator
          .longLiquidationPressure,

      shortLiquidationPressure:
        accumulator
          .shortLiquidationPressure,

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

  state.lastFrozenSnapshot30m =
    snapshot

  state.lastFrozenCandleTs30m =
    confirmedCandleTs

  state.accumulator30m =
    createEmptyInstitutionalEvidenceAccumulator30m()

  return snapshot
}

export function freezeInstitutionalEvidence1hServer(
  symbol: string,
  confirmedCandleTs: number,
): InstitutionalEvidenceSnapshot1h {
  const state =
    getOrCreateRuntimeState(symbol)

  if (
    state.lastFrozenCandleTs1h ===
      confirmedCandleTs &&
    state.lastFrozenSnapshot1h !== null
  ) {
    return state.lastFrozenSnapshot1h
  }

  const accumulator =
    state.accumulator1h

  const sampleCount =
    Math.max(
      accumulator.sampleCount,
      1,
    )

  const oiDeltaAverage =
    accumulator.oiDeltaAccum /
    sampleCount

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
    accumulator
      .oiDirectionalPersistenceAccum /
    sampleCount

  const fundingAverage =
    accumulator.fundingAccum /
    sampleCount

  const volumeRatioAverage =
    accumulator.volumeRatioAccum /
    sampleCount

  const whaleIntensityAverage =
    accumulator.whaleIntensityAccum /
    sampleCount

  const whaleRatioAverage =
    accumulator.whaleRatioAccum /
    sampleCount

  const whaleNetRatioAverage =
    accumulator.whaleNetRatioAccum /
    sampleCount

  const fmaiAverage =
    accumulator.fmaiAccum /
    sampleCount

  const absorptionAverage =
    accumulator.absorptionAccum /
    sampleCount

  const sweepAverage =
    accumulator.sweepAccum /
    sampleCount

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
    Math.abs(
      accumulator.absorptionAccum,
    ) > 0

  const sweepDetected =
    Math.abs(
      accumulator.sweepAccum,
    ) > 0

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

  const snapshot:
    InstitutionalEvidenceSnapshot1h = {
      timeframe: '1h',

      confirmedCandleTs,

      startTs:
        accumulator.startTs,

      endTs:
        Date.now(),

      sampleCount,

      oiDeltaAccum:
        accumulator.oiDeltaAccum,

      oiDeltaAverage,

      oiExpansionVelocityAccum:
        accumulator
          .oiExpansionVelocityAccum,

      oiExpansionVelocityAverage,

      oiCompressionVelocityAccum:
        accumulator
          .oiCompressionVelocityAccum,

      oiCompressionVelocityAverage,

      oiTrendStrengthAccum:
        accumulator
          .oiTrendStrengthAccum,

      oiTrendStrengthAverage,

      oiDirectionalPersistenceAccum:
        accumulator
          .oiDirectionalPersistenceAccum,

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
        accumulator
          .longLiquidationPressure,

      shortLiquidationPressure:
        accumulator
          .shortLiquidationPressure,

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

  state.lastFrozenSnapshot1h =
    snapshot

  state.lastFrozenCandleTs1h =
    confirmedCandleTs

  state.accumulator1h =
    createEmptyInstitutionalEvidenceAccumulator1h()

  return snapshot
}

export function evaluateInstitutionalPatternAtClose(
  symbol: string,
  confirmedCandleTs: number,
): InstitutionalPatternEvaluationResult {
  const snapshot30m =
    freezeInstitutionalEvidence30mServer(
      symbol,
      confirmedCandleTs,
    )

  const state =
    getOrCreateRuntimeState(symbol)

  const candidateSnapshot1h =
    new Date(
      confirmedCandleTs,
    ).getUTCMinutes() === 0
      ? freezeInstitutionalEvidence1hServer(
          symbol,
          confirmedCandleTs,
        )
      : state.lastFrozenSnapshot1h

  const snapshot1hAgeMs =
    candidateSnapshot1h === null
      ? null
      : confirmedCandleTs -
        candidateSnapshot1h.confirmedCandleTs

  const confirmationSnapshot1h =
    candidateSnapshot1h !== null &&
    snapshot1hAgeMs !== null &&
    snapshot1hAgeMs >= 0 &&
    snapshot1hAgeMs < 60 * 60 * 1000
      ? candidateSnapshot1h
      : null

  const detectedPattern =
    detectInstitutionalPattern({
      snapshotReady: true,

      oiDeltaAverage:
        snapshot30m.oiDeltaAverage,

      oiDeltaAccum:
        snapshot30m.oiDeltaAccum,

      oiDirectionalPersistenceAverage:
        snapshot30m
          .oiDirectionalPersistenceAverage,

      fundingAverage:
        snapshot30m.fundingAverage,

      fundingState:
        snapshot30m.fundingState,

      volumeRatioAverage:
        snapshot30m.volumeRatioAverage,

      volumeState:
        snapshot30m.volumeState,

      whaleIntensityAverage:
        snapshot30m.whaleIntensityAverage,

      whaleBias:
        snapshot30m.whaleBias,

      whaleBuyPressure:
        snapshot30m.whaleBuyPressure,

      whaleSellPressure:
        snapshot30m.whaleSellPressure,

      longLiquidationPressure:
        snapshot30m.longLiquidationPressure,

      shortLiquidationPressure:
        snapshot30m.shortLiquidationPressure,

      dominantFlow:
        snapshot30m.dominantFlow,

      oiDirectionalPressure:
        snapshot30m.oiDirectionalPressure,

      fmaiDirectionalPressure:
        snapshot30m.fmaiDirectionalPressure,

      absorptionAccum:
        snapshot30m.absorptionAccum,

      absorptionAverage:
        snapshot30m.absorptionAverage,

      sweepAccum:
        snapshot30m.sweepAccum,

      sweepAverage:
        snapshot30m.sweepAverage,

      institutionalEvents:
        snapshot30m.institutionalEvents,
    })

  if (
    !isInstitutionalReadyPatternPresentation(
      detectedPattern,
    )
  ) {
    return Object.freeze({
      status: 'NO_PATTERN',
      confirmedCandleTs,
      snapshot30m,
      snapshot1h:
        confirmationSnapshot1h,
      detectedPattern,
      confirmation1h: null,
    })
  }

  const confirmation1h =
    buildInstitutionalConfirmation1h(
      detectedPattern.type,
      confirmationSnapshot1h,
    )

  if (
    confirmation1h.action !== 'ALLOW'
  ) {
    return Object.freeze({
      status: 'BLOCKED_BY_1H',
      confirmedCandleTs,
      snapshot30m,
      snapshot1h:
        confirmationSnapshot1h,
      detectedPattern,
      confirmation1h,
    })
  }

  return Object.freeze({
    status: 'READY',
    confirmedCandleTs,
    snapshot30m,
    snapshot1h:
      confirmationSnapshot1h,
    detectedPattern,
    confirmation1h,
  })
}

/**
 * Creates at most one shared institutional evidence sample per 30 seconds for
 * a symbol.
 *
 * The sample is not created until a complete latest input has been provided
 * through updateInstitutionalPatternLatestState().
 *
 * The first sample may be created immediately after the latest input becomes
 * available, matching the existing browser throttle behavior whose previous
 * sample timestamp initially starts at 0.
 *
 * sampledAt is captured from Date.now() at the actual sample execution point.
 * The same returned sample object is supplied to both the 30-minute and
 * 1-hour accumulators.
 *
 * This function does not average, freeze, detect a pattern, or perform
 * confirmation.
 */
export function sampleInstitutionalEvidenceIfDue(
  symbol: string,
): SampleInstitutionalEvidenceResult {
  const state =
    runtimeStateBySymbol.get(symbol)

  if (
    !state ||
    state.latestInput === null
  ) {
    return Object.freeze({
      sampled: false,
      reason:
        'LATEST_INPUT_NOT_READY',
      sample: null,
      nextSampleAt: null,
    })
  }

  const sampledAt =
    Date.now()

  if (
    state.lastSampleAt !== 0 &&
    sampledAt - state.lastSampleAt <
      INSTITUTIONAL_EVIDENCE_SAMPLE_INTERVAL_MS
  ) {
    return Object.freeze({
      sampled: false,
      reason: 'THROTTLED',
      sample: null,
      nextSampleAt:
        state.lastSampleAt +
        INSTITUTIONAL_EVIDENCE_SAMPLE_INTERVAL_MS,
    })
  }

  evaluateOIDerivedState(state)

  const latestInput =
    state.latestInput

  const sample =
    createInstitutionalEvidenceSample({
      sampledAt,

      oiDelta:
        latestInput.oiDelta,
      oiExpansionVelocity:
        state.oiDerived
          .oiExpansionVelocity,
      oiCompressionVelocity:
        state.oiDerived
          .oiCompressionVelocity,
      oiTrendStrength:
        state.oiDerived
          .oiTrendStrength,
      oiDirectionalPersistence:
        state.oiDerived
          .oiDirectionalPersistence,

      volumeRatio:
        latestInput.volumeRatio,
      fundingRate:
        latestInput.fundingRate,

      whaleIntensity:
        latestInput.whaleIntensity,
      whaleNetRatio:
        latestInput.whaleNetRatio,
      whaleRatio:
        latestInput.whaleRatio,

      fmai:
        latestInput.fmai,
      absorption:
        latestInput.absorption,
      sweep:
        latestInput.sweep,
    })

  accumulateInstitutionalEvidence30mServer(
    symbol,
    sample,
  )

  accumulateInstitutionalEvidence1hServer(
    symbol,
    sample,
  )

  state.lastSampleAt =
    sampledAt

  return Object.freeze({
    sampled: true,
    reason: 'SAMPLED',
    sample,
    nextSampleAt:
      sampledAt +
      INSTITUTIONAL_EVIDENCE_SAMPLE_INTERVAL_MS,
  })
}
