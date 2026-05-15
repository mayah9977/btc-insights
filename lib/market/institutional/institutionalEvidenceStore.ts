// lib/market/institutional/institutionalEvidenceStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type {
  InstitutionalEvidenceSnapshot,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot'

type State = {
  snapshot: InstitutionalEvidenceSnapshot | null

  setSnapshot: (
    snapshot: InstitutionalEvidenceSnapshot,
  ) => void

  clearSnapshot: () => void
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
                  existingSnapshot.volumeRatioAccum,

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

        clearSnapshot: () =>
          set({
            snapshot: null,
          }),
      }),
      {
        name:
          'institutional-evidence-snapshot',

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
  