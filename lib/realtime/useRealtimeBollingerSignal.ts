// lib/realtime/useRealtimeBollingerSignal.ts

'use client'

import { create } from 'zustand'
import type { BollingerSignal } from '@/lib/market/actionGate/signalType'
import { freezeInstitutionalSnapshot } from '@/lib/market/institutional/institutionalEvidenceAccumulator'
import { useInstitutionalEvidenceStore } from '@/lib/market/institutional/institutionalEvidenceStore'

/**
 * UI-only store
 * - ❌ 판단 / 계산 없음
 * - ⭕ "확정된 BB_SIGNAL(30m)"만 보관
 * - Action Gate / Observation UI의 단일 입력
 */
type State = {
  last: BollingerSignal | null
  setLast: (v: BollingerSignal | null) => void
}

const useBollingerSignalStore = create<State>((set) => ({
  last: null,
  setLast: (v) => set({ last: v }),
}))

function getSignalConfirmedCandleTs(
  signal: BollingerSignal | null,
): number | null {
  if (!signal) {
    return null
  }

  const rawConfirmedCandleTs =
    (signal as any)?.closeTime ??
    (signal as any)?.candleCloseTime ??
    signal?.candle?.closeTime ??
    (signal as any)?.timestamp ??
    (signal as any)?.ts ??
    (signal as any)?.time

  return rawConfirmedCandleTs !== undefined &&
    rawConfirmedCandleTs !== null &&
    Number.isFinite(Number(rawConfirmedCandleTs))
    ? Number(rawConfirmedCandleTs)
    : null
}

function shouldUpdateBollingerSignal(
  current: BollingerSignal | null,
  next: BollingerSignal,
  nextConfirmedCandleTs: number | null,
): boolean {
  if (!next) {
    return false
  }

  if (
    next.confirmed === true &&
    next.timeframe === '30m' &&
    nextConfirmedCandleTs !== null
  ) {
    const currentConfirmedCandleTs =
      getSignalConfirmedCandleTs(current)

    if (
      current &&
      current.signalType === next.signalType &&
      current.confirmed === true &&
      current.timeframe === '30m' &&
      currentConfirmedCandleTs ===
        nextConfirmedCandleTs
    ) {
      return false
    }
  }

  if (!current) {
    return true
  }

  const currentConfirmedCandleTs =
    getSignalConfirmedCandleTs(current)

  const sameConfirmed30mSignal =
    current.signalType === next.signalType &&
    current.confirmed === true &&
    next.confirmed === true &&
    current.timeframe === '30m' &&
    next.timeframe === '30m' &&
    currentConfirmedCandleTs !== null &&
    nextConfirmedCandleTs !== null &&
    currentConfirmedCandleTs === nextConfirmedCandleTs

  return !sameConfirmed30mSignal
}

function applyLastSignalIfNeeded(
  signal: BollingerSignal,
  confirmedCandleTs: number | null,
  reason: string,
) {
  const store =
    useBollingerSignalStore.getState()

  const lastSignal =
    store.last

  const shouldUpdate =
    shouldUpdateBollingerSignal(
      lastSignal,
      signal,
      confirmedCandleTs,
    )

  if (!shouldUpdate) {
    console.log('[SET_LAST_SKIPPED]', {
      ts: Date.now(),
      reason,
      signalType: signal.signalType,
      confirmed: signal.confirmed,
      timeframe: signal.timeframe,
      confirmedCandleTs,
      previousSignalType:
        lastSignal?.signalType,
      previousConfirmedCandleTs:
        getSignalConfirmedCandleTs(lastSignal),
    })

    return
  }

  console.log('[SET_LAST_APPLIED]', {
    ts: Date.now(),
    reason,
    signalType: signal.signalType,
    confirmed: signal.confirmed,
    timeframe: signal.timeframe,
    confirmedCandleTs,
    previousSignalType:
      lastSignal?.signalType,
    previousConfirmedCandleTs:
      getSignalConfirmedCandleTs(lastSignal),
  })

  store.setLast(signal)
}

/**
 * ✅ UI 구독 훅
 * - Action Gate
 * - BBSignalCard
 * - Observation UI
 */
export function useRealtimeBollingerSignal() {
  return useBollingerSignalStore((s) => s.last)
}

/**
 * ✅ BB_SIGNAL → UI bridge (SSOT boundary)
 *
 * 원칙:
 * - confirmed 30m 신호만 허용
 * - 판단 / 해석 ❌
 * - 그대로 전달만 수행
 */
export function applyRealtimeBollingerSignal(signal: BollingerSignal) {
  const existingSnapshot =
    useInstitutionalEvidenceStore
      .getState()
      .snapshot

  const rawSignalConfirmedCandleTs =
    (signal as any)?.closeTime ??
    (signal as any)?.candleCloseTime ??
    signal?.candle?.closeTime ??
    (signal as any)?.timestamp ??
    (signal as any)?.ts ??
    (signal as any)?.time

  const signalConfirmedCandleTs =
    rawSignalConfirmedCandleTs !== undefined &&
    rawSignalConfirmedCandleTs !== null &&
    Number.isFinite(
      Number(rawSignalConfirmedCandleTs),
    )
      ? Number(rawSignalConfirmedCandleTs)
      : null

  const sameConfirmedCandleReplay =
    signalConfirmedCandleTs !== null &&
    existingSnapshot?.confirmedCandleTs ===
      signalConfirmedCandleTs

  console.log('[APPLY_REALTIME_BOLLINGER_SIGNAL]', {
    ts: Date.now(),
    signalType: signal?.signalType,
    confirmed: signal?.confirmed,
    timeframe: signal?.timeframe,
    confirmedCandleTs:
      signalConfirmedCandleTs,
    rawConfirmedCandleTs:
      rawSignalConfirmedCandleTs,
    confirmedCandleCloseTime:
      rawSignalConfirmedCandleTs,
    candleOpenTime:
      signal?.candle?.openTime,
    existingPersistedSnapshotConfirmedCandleTs:
      existingSnapshot?.confirmedCandleTs,
    existingPersistedSnapshotConfirmedSignalType:
      existingSnapshot?.confirmedSignalType,
    sameConfirmedCandleReplay,
    overwriteBlockedExpected:
      sameConfirmedCandleReplay,
  })

  if (!signal) return

  // 🔒 30m 확정 봉만 UI에 반영
  if (signal.timeframe !== '30m') return
  if (signal.confirmed !== true) return

  /**
   * 🔥 institutional freeze
   * 🔥 confirmed Bollinger ENUM bridge snapshot freeze
   *
   * Bollinger ENUM은 그대로 SSOT로 유지하고,
   * confirmed ENUM transition 순간에
   * 30분 동안 누적된 Institutional Evidence만
   * narrative reinforcement 용도로 freeze합니다.
   */
  const rawConfirmedCandleTs =
    (signal as any).closeTime ??
    (signal as any).candleCloseTime ??
    signal?.candle?.closeTime ??
    (signal as any).timestamp ??
    (signal as any).ts ??
    (signal as any).time

  const confirmedCandleTs =
    rawConfirmedCandleTs !== undefined &&
    rawConfirmedCandleTs !== null &&
    Number.isFinite(Number(rawConfirmedCandleTs))
      ? Number(rawConfirmedCandleTs)
      : null

  if (confirmedCandleTs === null) {
    console.log(
      '[ENUM_FREEZE_SKIPPED_MISSING_CONFIRMED_CANDLE_TS]',
      {
        ts: Date.now(),
        lifecycleBoundary:
          'CONFIRMED_BOLLINGER_ENUM_BRIDGE',
        signalType: signal.signalType,
        confirmed: signal.confirmed,
        timeframe: signal.timeframe,
        signalCloseTime:
          (signal as any).closeTime,
        signalCandleCloseTime:
          (signal as any).candleCloseTime,
        candleCloseTime:
          signal?.candle?.closeTime,
        signalTimestamp:
          (signal as any).timestamp,
        signalTs:
          (signal as any).ts,
        signalTime:
          (signal as any).time,
        reason:
          'MISSING_CONFIRMED_CANDLE_TS_FREEZE_SKIPPED',
      },
    )

    applyLastSignalIfNeeded(
      signal,
      confirmedCandleTs,
      'MISSING_CONFIRMED_CANDLE_TS',
    )

    return
  }

  const lastSignal =
    useBollingerSignalStore
      .getState()
      .last

  const rawLastSignalConfirmedCandleTs =
    (lastSignal as any)?.closeTime ??
    (lastSignal as any)?.candleCloseTime ??
    lastSignal?.candle?.closeTime ??
    (lastSignal as any)?.timestamp ??
    (lastSignal as any)?.ts ??
    (lastSignal as any)?.time

  const lastSignalConfirmedCandleTs =
    rawLastSignalConfirmedCandleTs !== undefined &&
    rawLastSignalConfirmedCandleTs !== null &&
    Number.isFinite(
      Number(rawLastSignalConfirmedCandleTs),
    )
      ? Number(rawLastSignalConfirmedCandleTs)
      : null

  const existingSnapshotBeforeFreeze =
    useInstitutionalEvidenceStore
      .getState()
      .snapshot

  const runtimeSameEnumState =
    lastSignal?.signalType ===
    signal.signalType

  const persistedSameEnumState =
    existingSnapshotBeforeFreeze
      ?.confirmedSignalType === signal.signalType

  const sameEnumState =
    runtimeSameEnumState ||
    persistedSameEnumState

  const runtimeSameConfirmedCandle =
    lastSignalConfirmedCandleTs !== null &&
    lastSignalConfirmedCandleTs ===
      confirmedCandleTs

  const persistedSameConfirmedCandle =
    existingSnapshotBeforeFreeze
      ?.confirmedCandleTs === confirmedCandleTs

  const sameEnumSameConfirmedCandleReplay =
    sameEnumState &&
    (
      runtimeSameConfirmedCandle ||
      persistedSameConfirmedCandle
    )

  if (sameEnumSameConfirmedCandleReplay) {
    console.log(
      '[ENUM_FREEZE_SKIPPED_SAME_ENUM_SAME_CONFIRMED_CANDLE]',
      {
        ts: Date.now(),
        lifecycleBoundary:
          'CONFIRMED_BOLLINGER_ENUM_BRIDGE',
        signalType: signal.signalType,
        previousSignalType:
          lastSignal?.signalType,
        persistedConfirmedSignalType:
          existingSnapshotBeforeFreeze
            ?.confirmedSignalType,
        runtimeSameEnumState,
        persistedSameEnumState,
        runtimeSameConfirmedCandle,
        persistedSameConfirmedCandle,
        sameEnumState,
        sameEnumSameConfirmedCandleReplay,
        confirmed: signal.confirmed,
        timeframe: signal.timeframe,
        confirmedCandleTs,
        rawConfirmedCandleTs,
        lastSignalConfirmedCandleTs,
        existingPersistedSnapshotConfirmedCandleTs:
          existingSnapshotBeforeFreeze
            ?.confirmedCandleTs,
        reason:
          'SAME_ENUM_AND_SAME_CONFIRMED_CANDLE_REPLAY_KEEP_EXISTING_INSTITUTIONAL_SNAPSHOT',
        accumulatorResetPrevented: true,
        freezeCalled: false,
        setLastCalled: false,
      },
    )

    console.log('[SET_LAST_SKIPPED]', {
      ts: Date.now(),
      reason:
        'SAME_ENUM_SAME_CONFIRMED_CANDLE_REPLAY',
      signalType: signal.signalType,
      confirmed: signal.confirmed,
      timeframe: signal.timeframe,
      confirmedCandleTs,
      previousSignalType:
        lastSignal?.signalType,
      previousConfirmedCandleTs:
        getSignalConfirmedCandleTs(lastSignal),
    })

    return
  }

  const duplicateReplayBeforeFreeze =
    existingSnapshotBeforeFreeze
      ?.confirmedCandleTs === confirmedCandleTs

  const sameEnumNewConfirmedCandle =
    sameEnumState &&
    !sameEnumSameConfirmedCandleReplay

  console.log('[ENUM_FREEZE_SYNC_BEFORE]', {
    ts: Date.now(),
    lifecycleBoundary:
      'CONFIRMED_BOLLINGER_ENUM_BRIDGE',
    signalType: signal.signalType,
    previousSignalType:
      lastSignal?.signalType,
    persistedConfirmedSignalType:
      existingSnapshotBeforeFreeze
        ?.confirmedSignalType,
    runtimeSameEnumState,
    persistedSameEnumState,
    runtimeSameConfirmedCandle,
    persistedSameConfirmedCandle,
    sameEnumState,
    sameEnumSameConfirmedCandleReplay,
    sameEnumNewConfirmedCandle,
    enumTransition:
      !sameEnumState,
    freezeAllowedReason:
      sameEnumNewConfirmedCandle
        ? 'SAME_ENUM_NEW_CONFIRMED_CANDLE'
        : 'ENUM_TRANSITION',
    confirmed: signal.confirmed,
    timeframe: signal.timeframe,
    confirmedCandleTs,
    rawConfirmedCandleTs,
    signalCloseTime:
      (signal as any).closeTime,
    signalCandleCloseTime:
      (signal as any).candleCloseTime,
    signalTimestamp:
      (signal as any).timestamp,
    signalTs:
      (signal as any).ts,
    signalTime:
      (signal as any).time,
    candleCloseTime:
      signal?.candle?.closeTime,
    candleOpenTime:
      signal?.candle?.openTime,
    existingPersistedSnapshotConfirmedCandleTs:
      existingSnapshotBeforeFreeze
        ?.confirmedCandleTs,
    duplicateReplayBeforeFreeze,
    expectedBehavior:
      duplicateReplayBeforeFreeze
        ? 'RETURN_PERSISTED_SNAPSHOT'
        : 'CREATE_FINALIZED_SNAPSHOT',
  })

  console.log('[FREEZE_BEFORE]', {
    ts: Date.now(),
    signalType: signal.signalType,
    previousSignalType:
      lastSignal?.signalType,
    persistedConfirmedSignalType:
      existingSnapshotBeforeFreeze
        ?.confirmedSignalType,
    runtimeSameEnumState,
    persistedSameEnumState,
    runtimeSameConfirmedCandle,
    persistedSameConfirmedCandle,
    sameEnumState,
    sameEnumSameConfirmedCandleReplay,
    sameEnumNewConfirmedCandle,
    enumTransition:
      !sameEnumState,
    freezeAllowedReason:
      sameEnumNewConfirmedCandle
        ? 'SAME_ENUM_NEW_CONFIRMED_CANDLE'
        : 'ENUM_TRANSITION',
    confirmed: signal.confirmed,
    confirmedCandleTs,
    existingPersistedSnapshotConfirmedCandleTs:
      existingSnapshotBeforeFreeze
        ?.confirmedCandleTs,
    duplicateReplayBeforeFreeze,
    overwriteBlockedExpected:
      duplicateReplayBeforeFreeze,
  })

  const frozenInstitutionalSnapshot =
    freezeInstitutionalSnapshot(
      confirmedCandleTs,
    )

  const institutionalSnapshot = {
    ...frozenInstitutionalSnapshot,
    confirmedSignalType:
      signal.signalType,
  }

  const existingSnapshotAfterFreeze =
    useInstitutionalEvidenceStore
      .getState()
      .snapshot

  const duplicateReplayAfterFreeze =
    existingSnapshotAfterFreeze
      ?.confirmedCandleTs ===
    institutionalSnapshot.confirmedCandleTs

  const enumFreezeSynchronized =
    institutionalSnapshot.confirmedCandleTs ===
    confirmedCandleTs

  console.log('[ENUM_FREEZE_SYNC_AFTER]', {
    ts: Date.now(),
    lifecycleBoundary:
      'CONFIRMED_BOLLINGER_ENUM_BRIDGE',
    signalType: signal.signalType,
    snapshotConfirmedSignalType:
      institutionalSnapshot.confirmedSignalType,
    previousSignalType:
      lastSignal?.signalType,
    persistedConfirmedSignalType:
      existingSnapshotBeforeFreeze
        ?.confirmedSignalType,
    runtimeSameEnumState,
    persistedSameEnumState,
    runtimeSameConfirmedCandle,
    persistedSameConfirmedCandle,
    sameEnumState,
    sameEnumSameConfirmedCandleReplay,
    sameEnumNewConfirmedCandle,
    enumTransition:
      !sameEnumState,
    freezeAllowedReason:
      sameEnumNewConfirmedCandle
        ? 'SAME_ENUM_NEW_CONFIRMED_CANDLE'
        : 'ENUM_TRANSITION',
    confirmed: signal.confirmed,
    timeframe: signal.timeframe,
    confirmedCandleTs,
    rawConfirmedCandleTs,
    snapshotConfirmedCandleTs:
      institutionalSnapshot.confirmedCandleTs,
    enumFreezeSynchronized,
    sampleCount:
      institutionalSnapshot.sampleCount,
    oiDeltaAccum:
      institutionalSnapshot.oiDeltaAccum,
    fundingAccum:
      institutionalSnapshot.fundingAccum,
    volumeRatioAccum:
      institutionalSnapshot.volumeRatioAccum,
    whaleIntensityAccum:
      institutionalSnapshot.whaleIntensityAccum,
    existingPersistedSnapshotConfirmedCandleTs:
      existingSnapshotAfterFreeze
        ?.confirmedCandleTs,
    duplicateReplayAfterFreeze,
    expectedImmutableOwnership:
      enumFreezeSynchronized,
  })

  console.log('[FREEZE_AFTER]', {
    ts: Date.now(),
    signalType: signal.signalType,
    snapshotConfirmedSignalType:
      institutionalSnapshot.confirmedSignalType,
    previousSignalType:
      lastSignal?.signalType,
    persistedConfirmedSignalType:
      existingSnapshotBeforeFreeze
        ?.confirmedSignalType,
    runtimeSameEnumState,
    persistedSameEnumState,
    runtimeSameConfirmedCandle,
    persistedSameConfirmedCandle,
    sameEnumState,
    sameEnumSameConfirmedCandleReplay,
    sameEnumNewConfirmedCandle,
    enumTransition:
      !sameEnumState,
    freezeAllowedReason:
      sameEnumNewConfirmedCandle
        ? 'SAME_ENUM_NEW_CONFIRMED_CANDLE'
        : 'ENUM_TRANSITION',
    confirmed: signal.confirmed,
    confirmedCandleTs:
      institutionalSnapshot.confirmedCandleTs,
    sampleCount:
      institutionalSnapshot.sampleCount,
    oiDeltaAccum:
      institutionalSnapshot.oiDeltaAccum,
    fundingAccum:
      institutionalSnapshot.fundingAccum,
    volumeRatioAccum:
      institutionalSnapshot.volumeRatioAccum,
    whaleIntensityAccum:
      institutionalSnapshot.whaleIntensityAccum,
    snapshotConfirmedCandleTs:
      institutionalSnapshot.confirmedCandleTs,
    existingPersistedSnapshotConfirmedCandleTs:
      existingSnapshotAfterFreeze
        ?.confirmedCandleTs,
    duplicateReplayAfterFreeze,
    overwriteBlockedExpected:
      duplicateReplayAfterFreeze,
  })

  console.log(
    '[LOCAL_ACCUMULATOR_FINALIZED_STORE_WRITE_SKIPPED]',
    {
      ts: Date.now(),
      reason:
        'FINALIZED_30M_STORE_IS_REDIS_API_OWNED',
      signalType:
        signal.signalType,
      snapshotConfirmedSignalType:
        institutionalSnapshot.confirmedSignalType,
      confirmedCandleTs,
      attemptedSnapshotConfirmedCandleTs:
        institutionalSnapshot.confirmedCandleTs,
      sampleCount:
        institutionalSnapshot.sampleCount,
      oiDeltaAccum:
        institutionalSnapshot.oiDeltaAccum,
      fundingAccum:
        institutionalSnapshot.fundingAccum,
      volumeRatioAccum:
        institutionalSnapshot.volumeRatioAccum,
      whaleIntensityAccum:
        institutionalSnapshot.whaleIntensityAccum,
    },
  )

  const existingSnapshotAfterSet =
    useInstitutionalEvidenceStore
      .getState()
      .snapshot

  const persistedSnapshotSynchronized =
    existingSnapshotAfterSet
      ?.confirmedCandleTs === confirmedCandleTs

  const persistedEnumPhaseSynchronized =
    existingSnapshotAfterSet
      ?.confirmedSignalType === signal.signalType

  console.log('[ENUM_FREEZE_SYNC_PERSISTED]', {
    ts: Date.now(),
    lifecycleBoundary:
      'CONFIRMED_BOLLINGER_ENUM_BRIDGE',
    signalType: signal.signalType,
    snapshotConfirmedSignalType:
      institutionalSnapshot.confirmedSignalType,
    persistedConfirmedSignalType:
      existingSnapshotAfterSet
        ?.confirmedSignalType,
    previousSignalType:
      lastSignal?.signalType,
    runtimeSameEnumState,
    persistedSameEnumState,
    runtimeSameConfirmedCandle,
    persistedSameConfirmedCandle,
    sameEnumState,
    sameEnumSameConfirmedCandleReplay,
    sameEnumNewConfirmedCandle,
    enumTransition:
      !sameEnumState,
    freezeAllowedReason:
      sameEnumNewConfirmedCandle
        ? 'SAME_ENUM_NEW_CONFIRMED_CANDLE'
        : 'ENUM_TRANSITION',
    confirmed: signal.confirmed,
    timeframe: signal.timeframe,
    confirmedCandleTs,
    rawConfirmedCandleTs,
    snapshotConfirmedCandleTs:
      institutionalSnapshot.confirmedCandleTs,
    persistedSnapshotConfirmedCandleTs:
      existingSnapshotAfterSet
        ?.confirmedCandleTs,
    enumFreezeSynchronized,
    persistedSnapshotSynchronized,
    persistedEnumPhaseSynchronized,
    sameImmutableInstitutionalSnapshot:
      enumFreezeSynchronized &&
      persistedSnapshotSynchronized &&
      persistedEnumPhaseSynchronized,
  })

  console.log('[SET_SNAPSHOT_AFTER_BRIDGE]', {
    ts: Date.now(),
    signalType: signal.signalType,
    snapshotConfirmedSignalType:
      institutionalSnapshot.confirmedSignalType,
    persistedConfirmedSignalType:
      existingSnapshotAfterSet
        ?.confirmedSignalType,
    previousSignalType:
      lastSignal?.signalType,
    runtimeSameEnumState,
    persistedSameEnumState,
    runtimeSameConfirmedCandle,
    persistedSameConfirmedCandle,
    sameEnumState,
    sameEnumSameConfirmedCandleReplay,
    sameEnumNewConfirmedCandle,
    enumTransition:
      !sameEnumState,
    freezeAllowedReason:
      sameEnumNewConfirmedCandle
        ? 'SAME_ENUM_NEW_CONFIRMED_CANDLE'
        : 'ENUM_TRANSITION',
    confirmed: signal.confirmed,
    confirmedCandleTs,
    existingPersistedSnapshotConfirmedCandleTs:
      existingSnapshotAfterSet
        ?.confirmedCandleTs,
    attemptedSnapshotConfirmedCandleTs:
      institutionalSnapshot.confirmedCandleTs,
    overwriteBlocked: true,
    sameConfirmedCandleReplay:
      existingSnapshotAfterSet
        ?.confirmedCandleTs ===
      institutionalSnapshot.confirmedCandleTs,
    skippedReason:
      'FINALIZED_30M_STORE_IS_REDIS_API_OWNED',
  })

  applyLastSignalIfNeeded(
    signal,
    confirmedCandleTs,
    'NEW_CONFIRMED_30M_SIGNAL',
  )
}
