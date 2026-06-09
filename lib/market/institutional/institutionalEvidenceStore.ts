// lib/market/institutional/institutionalEvidenceStore.ts

import { create } from 'zustand'
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware'

import type {
  InstitutionalEvidenceSnapshot,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot'

type State = {
  snapshot: InstitutionalEvidenceSnapshot | null

  setSnapshot: (
    snapshot: InstitutionalEvidenceSnapshot,
  ) => void

  setFinalizedSnapshot: (
    snapshot: InstitutionalEvidenceSnapshot,
  ) => void

  clearSnapshot: () => void
}

/**
 * Next.js App Router safe storage.
 *
 * Server evaluation 시점에는 localStorage 가 없기 때문에
 * zustand persist hydration 에서 storage.getItem 오류가 발생할 수 있습니다.
 *
 * persist 자체는 유지하되, server runtime 에서는 noop storage 를 제공해
 * getItem / setItem / removeItem shape 을 항상 보장합니다.
 */
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

function getInstitutionalSnapshotStorage(): StateStorage {
  if (typeof window === 'undefined') {
    return noopStorage
  }

  try {
    return window.localStorage
  } catch {
    return noopStorage
  }
}

function createFinalizedSnapshotCoreFingerprint(
  snapshot:
    | InstitutionalEvidenceSnapshot
    | null
    | undefined,
): string {
  if (!snapshot) {
    return ''
  }

  return [
    snapshot.confirmedCandleTs ?? '',
    snapshot.sampleCount ?? '',

    snapshot.oiDeltaAverage ?? '',
    snapshot.oiDeltaAccum ?? '',

    snapshot.volumeRatioAverage ?? '',
    snapshot.whaleIntensityAverage ?? '',
    snapshot.whaleNetRatioAverage ?? '',

    snapshot.fundingAverage ?? '',

    snapshot.fmaiDirectionalPressure ?? '',
    snapshot.oiDirectionalPressure ?? '',
    snapshot.dominantFlow ?? '',
    snapshot.whaleBias ?? '',
    snapshot.volumeState ?? '',
    snapshot.fundingState ?? '',
  ].join('|')
}

export const useInstitutionalEvidenceStore =
  create<State>()(
    persist(
      (set, get) => ({
        snapshot: null,

        setSnapshot: (snapshot) => {
          const existingSnapshot =
            get().snapshot

          console.log(
            '[SET_INSTITUTIONAL_SNAPSHOT]',
            {
              ts: Date.now(),

              existingConfirmedCandleTs:
                existingSnapshot
                  ?.confirmedCandleTs,

              newConfirmedCandleTs:
                snapshot.confirmedCandleTs,

              existingConfirmedSignalType:
                existingSnapshot
                  ?.confirmedSignalType,

              newConfirmedSignalType:
                snapshot.confirmedSignalType,

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

          /**
           * 🔒 Historical finalized snapshot immutability
           *
           * same confirmed candle
           * → overwrite blocked
           */
          if (
            existingSnapshot &&
            existingSnapshot.confirmedCandleTs ===
              snapshot.confirmedCandleTs
          ) {
            console.log(
              '[SET_INSTITUTIONAL_SNAPSHOT_BLOCKED]',
              {
                ts: Date.now(),

                confirmedCandleTs:
                  snapshot.confirmedCandleTs,

                existingConfirmedSignalType:
                  existingSnapshot
                    .confirmedSignalType,

                newConfirmedSignalType:
                  snapshot.confirmedSignalType,

                existingSampleCount:
                  existingSnapshot.sampleCount,

                newSampleCount:
                  snapshot.sampleCount,

                existingOiDeltaAccum:
                  existingSnapshot.oiDeltaAccum,

                newOiDeltaAccum:
                  snapshot.oiDeltaAccum,

                existingFundingAccum:
                  existingSnapshot.fundingAccum,

                newFundingAccum:
                  snapshot.fundingAccum,

                existingVolumeRatioAccum:
                  existingSnapshot
                    .volumeRatioAccum,

                newVolumeRatioAccum:
                  snapshot.volumeRatioAccum,

                existingWhaleIntensityAccum:
                  existingSnapshot
                    .whaleIntensityAccum,

                newWhaleIntensityAccum:
                  snapshot.whaleIntensityAccum,
              },
            )

            return
          }

          set({
            snapshot,
          })
        },

        setFinalizedSnapshot: (snapshot) => {
          const existingSnapshot =
            get().snapshot

          console.log(
            '[SET_FINALIZED_INSTITUTIONAL_SNAPSHOT_FROM_API]',
            {
              ts: Date.now(),

              existingConfirmedCandleTs:
                existingSnapshot
                  ?.confirmedCandleTs,

              newConfirmedCandleTs:
                snapshot.confirmedCandleTs,

              existingConfirmedSignalType:
                existingSnapshot
                  ?.confirmedSignalType,

              newConfirmedSignalType:
                snapshot.confirmedSignalType,

              existingSampleCount:
                existingSnapshot?.sampleCount,

              newSampleCount:
                snapshot.sampleCount,

              existingOiDeltaAccum:
                existingSnapshot?.oiDeltaAccum,

              newOiDeltaAccum:
                snapshot.oiDeltaAccum,

              existingFundingAccum:
                existingSnapshot?.fundingAccum,

              newFundingAccum:
                snapshot.fundingAccum,

              existingVolumeRatioAccum:
                existingSnapshot
                  ?.volumeRatioAccum,

              newVolumeRatioAccum:
                snapshot.volumeRatioAccum,

              existingWhaleIntensityAccum:
                existingSnapshot
                  ?.whaleIntensityAccum,

              newWhaleIntensityAccum:
                snapshot.whaleIntensityAccum,
            },
          )

          const existingCoreFingerprint =
            createFinalizedSnapshotCoreFingerprint(
              existingSnapshot,
            )

          const newCoreFingerprint =
            createFinalizedSnapshotCoreFingerprint(
              snapshot,
            )

          const sameFingerprint =
            !!existingSnapshot &&
            existingCoreFingerprint ===
              newCoreFingerprint

          if (sameFingerprint) {
            console.log(
              '[SET_FINALIZED_SNAPSHOT_SKIPPED_SAME_FINGERPRINT]',
              {
                ts: Date.now(),
                confirmedCandleTs:
                  snapshot.confirmedCandleTs,
                sampleCount:
                  snapshot.sampleCount,
                existingFingerprint:
                  existingCoreFingerprint,
                newFingerprint:
                  newCoreFingerprint,
                existingEndTs:
                  existingSnapshot.endTs,
                newEndTs:
                  snapshot.endTs,
                reason:
                  'SAME_CORE_FINALIZED_SNAPSHOT',
              },
            )

            return
          }

          set({
            snapshot,
          })
        },

        clearSnapshot: () => {
          console.log('[CLEAR_INSTITUTIONAL_SNAPSHOT]', {
            ts: Date.now(),
            previousSnapshot: get().snapshot,
          })

          set({
            snapshot: null,
          })
        },
      }),
      {
        name:
          'institutional-evidence-snapshot',

        storage: createJSONStorage(
          getInstitutionalSnapshotStorage,
        ),

        partialize: (state) => ({
          snapshot: state.snapshot,
        }),

        onRehydrateStorage: () => (
          state,
          error,
        ) => {
          if (error) {
            console.log(
              '[INSTITUTIONAL_SNAPSHOT_REHYDRATE_ERROR]',
              {
                ts: Date.now(),

                error,
              },
            )

            return
          }

          console.log(
            '[INSTITUTIONAL_SNAPSHOT_REHYDRATED]',
            {
              ts: Date.now(),

              confirmedCandleTs:
                state?.snapshot
                  ?.confirmedCandleTs,

              confirmedSignalType:
                state?.snapshot
                  ?.confirmedSignalType,

              sampleCount:
                state?.snapshot?.sampleCount,

              oiDeltaAccum:
                state?.snapshot?.oiDeltaAccum,

              fundingAccum:
                state?.snapshot?.fundingAccum,

              volumeRatioAccum:
                state?.snapshot
                  ?.volumeRatioAccum,

              whaleIntensityAccum:
                state?.snapshot
                  ?.whaleIntensityAccum,
            },
          )
        },
      },
    ),
  )
  