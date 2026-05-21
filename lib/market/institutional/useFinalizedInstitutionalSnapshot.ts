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

  oiExpansionVelocityAccum: number
  oiExpansionVelocityAverage: number

  oiCompressionVelocityAccum: number
  oiCompressionVelocityAverage: number

  oiTrendStrengthAccum: number
  oiTrendStrengthAverage: number

  oiDirectionalPersistenceAccum: number
  oiDirectionalPersistenceAverage: number

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

  fmaiAccum: number
  fmaiAverage: number

  absorptionAccum: number
  absorptionAverage: number

  sweepAccum: number
  sweepAverage: number

  longLiquidationPressure: number
  shortLiquidationPressure: number

  dominantFlow: string
  fundingState: string
  whaleBias: string
  volumeState: string

  divergenceDetected: boolean
  absorptionDetected: boolean
  sweepDetected: boolean

  fmaiDirectionalPressure: string
  oiDirectionalPressure: string

  institutionalEvents: {
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

  startTs: number | null
  endTs: number | null
}

const EMPTY_EVENTS = {
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

        oiExpansionVelocityAccum: 0,
        oiExpansionVelocityAverage: 0,

        oiCompressionVelocityAccum: 0,
        oiCompressionVelocityAverage: 0,

        oiTrendStrengthAccum: 0,
        oiTrendStrengthAverage: 0,

        oiDirectionalPersistenceAccum: 0,
        oiDirectionalPersistenceAverage: 0,

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

        fmaiAccum: 0,
        fmaiAverage: 0,

        absorptionAccum: 0,
        absorptionAverage: 0,

        sweepAccum: 0,
        sweepAverage: 0,

        longLiquidationPressure: 0,
        shortLiquidationPressure: 0,

        dominantFlow: 'NEUTRAL',
        fundingState: 'NEUTRAL',
        whaleBias: 'NEUTRAL',
        volumeState: 'NORMAL',

        divergenceDetected: false,
        absorptionDetected: false,
        sweepDetected: false,

        fmaiDirectionalPressure: 'NEUTRAL',
        oiDirectionalPressure: 'NEUTRAL',

        institutionalEvents: EMPTY_EVENTS,

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

      oiExpansionVelocityAccum:
        snapshot.oiExpansionVelocityAccum,

      oiExpansionVelocityAverage:
        snapshot.oiExpansionVelocityAverage,

      oiCompressionVelocityAccum:
        snapshot.oiCompressionVelocityAccum,

      oiCompressionVelocityAverage:
        snapshot.oiCompressionVelocityAverage,

      oiTrendStrengthAccum:
        snapshot.oiTrendStrengthAccum,

      oiTrendStrengthAverage:
        snapshot.oiTrendStrengthAverage,

      oiDirectionalPersistenceAccum:
        snapshot.oiDirectionalPersistenceAccum,

      oiDirectionalPersistenceAverage:
        snapshot.oiDirectionalPersistenceAverage,

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

      fmaiAccum:
        snapshot.fmaiAccum,

      fmaiAverage:
        snapshot.fmaiAverage,

      absorptionAccum:
        snapshot.absorptionAccum,

      absorptionAverage:
        snapshot.absorptionAverage,

      sweepAccum:
        snapshot.sweepAccum,

      sweepAverage:
        snapshot.sweepAverage,

      longLiquidationPressure:
        snapshot.longLiquidationPressure,

      shortLiquidationPressure:
        snapshot.shortLiquidationPressure,

      dominantFlow:
        snapshot.dominantFlow,

      fundingState:
        snapshot.fundingState,

      whaleBias:
        snapshot.whaleBias,

      volumeState:
        snapshot.volumeState,

      divergenceDetected:
        snapshot.divergenceDetected,

      absorptionDetected:
        snapshot.absorptionDetected,

      sweepDetected:
        snapshot.sweepDetected,

      fmaiDirectionalPressure:
        snapshot.fmaiDirectionalPressure,

      oiDirectionalPressure:
        snapshot.oiDirectionalPressure,

      institutionalEvents:
        snapshot.institutionalEvents ??
        EMPTY_EVENTS,

      startTs:
        snapshot.startTs,

      endTs:
        snapshot.endTs,
    }
  }, [snapshot])
}
