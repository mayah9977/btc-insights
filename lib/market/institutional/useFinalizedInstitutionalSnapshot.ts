// lib/market/institutional/useFinalizedInstitutionalSnapshot.ts

'use client'

import { useMemo } from 'react'

import { useInstitutionalEvidenceStore } from '@/lib/market/institutional/institutionalEvidenceStore'

export type FinalizedInstitutionalSnapshotView = {
  snapshotReady: boolean

  confirmedCandleTs: number | null
  confirmedSignalType: string | null

  sampleCount: number

  oiDeltaAccum: number
  oiDeltaAverage: number

  fundingAccum: number
  fundingAverage: number
  fundingMax: number
  fundingMin: number

  volumeRatioAccum: number
  volumeRatioAverage: number
  volumeExpansionCount: number
  volumeWeakCount: number

  whaleIntensityAccum: number
  whaleIntensityAverage: number

  whaleRatioAccum: number
  whaleRatioAverage: number

  whaleNetRatioAccum: number
  whaleNetRatioAverage: number

  whaleBuyPressure: number
  whaleSellPressure: number

  dominantFlow: string
  fundingState: string
  whaleBias: string
  volumeState: string

  startTs: number | null
  endTs: number | null
}

export function useFinalizedInstitutionalSnapshot():
  FinalizedInstitutionalSnapshotView {
  const snapshot =
    useInstitutionalEvidenceStore(
      (s) => s.snapshot,
    )

  return useMemo(() => {
    if (!snapshot) {
      return {
        snapshotReady: false,

        confirmedCandleTs: null,
        confirmedSignalType: null,

        sampleCount: 0,

        oiDeltaAccum: 0,
        oiDeltaAverage: 0,

        fundingAccum: 0,
        fundingAverage: 0,
        fundingMax: 0,
        fundingMin: 0,

        volumeRatioAccum: 0,
        volumeRatioAverage: 0,
        volumeExpansionCount: 0,
        volumeWeakCount: 0,

        whaleIntensityAccum: 0,
        whaleIntensityAverage: 0,

        whaleRatioAccum: 0,
        whaleRatioAverage: 0,

        whaleNetRatioAccum: 0,
        whaleNetRatioAverage: 0,

        whaleBuyPressure: 0,
        whaleSellPressure: 0,

        dominantFlow: 'NEUTRAL',
        fundingState: 'NEUTRAL',
        whaleBias: 'NEUTRAL',
        volumeState: 'NORMAL',

        startTs: null,
        endTs: null,
      }
    }

    return {
      snapshotReady: true,

      confirmedCandleTs:
        snapshot.confirmedCandleTs,

      confirmedSignalType:
        snapshot.confirmedSignalType ?? null,

      sampleCount:
        snapshot.sampleCount,

      oiDeltaAccum:
        snapshot.oiDeltaAccum,

      oiDeltaAverage:
        snapshot.oiDeltaAverage,

      fundingAccum:
        snapshot.fundingAccum,

      fundingAverage:
        snapshot.fundingAverage,

      fundingMax:
        snapshot.fundingMax,

      fundingMin:
        snapshot.fundingMin,

      volumeRatioAccum:
        snapshot.volumeRatioAccum,

      volumeRatioAverage:
        snapshot.volumeRatioAverage,

      volumeExpansionCount:
        snapshot.volumeExpansionCount,

      volumeWeakCount:
        snapshot.volumeWeakCount,

      whaleIntensityAccum:
        snapshot.whaleIntensityAccum,

      whaleIntensityAverage:
        snapshot.whaleIntensityAverage,

      whaleRatioAccum:
        snapshot.whaleRatioAccum,

      whaleRatioAverage:
        snapshot.whaleRatioAverage,

      whaleNetRatioAccum:
        snapshot.whaleNetRatioAccum,

      whaleNetRatioAverage:
        snapshot.whaleNetRatioAverage,

      whaleBuyPressure:
        snapshot.whaleBuyPressure,

      whaleSellPressure:
        snapshot.whaleSellPressure,

      dominantFlow:
        snapshot.dominantFlow,

      fundingState:
        snapshot.fundingState,

      whaleBias:
        snapshot.whaleBias,

      volumeState:
        snapshot.volumeState,

      startTs:
        snapshot.startTs,

      endTs:
        snapshot.endTs,
    }
  }, [snapshot])
}
