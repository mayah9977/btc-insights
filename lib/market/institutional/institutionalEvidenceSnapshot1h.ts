// lib/market/institutional/institutionalEvidenceSnapshot1h.ts

import type {
  InstitutionalDirectionalPressure,
  InstitutionalDominantFlow,
  InstitutionalFundingState,
  InstitutionalVolumeState,
  InstitutionalWhaleBias,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot'

export type InstitutionalConfirmationDirection1h =
  | 'LONG'
  | 'SHORT'
  | 'NEUTRAL'

export interface InstitutionalEvidenceSnapshot1h {
  /**
   * 🔥 freeze metadata
   */
  timeframe: '1h'
  confirmedCandleTs: number

  startTs: number
  endTs: number

  sampleCount: number

  oiDeltaAccum: number
  oiDeltaAverage: number

  /**
   * 🔥 OI velocity layer
   */
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

  dominantFlow: InstitutionalDominantFlow
  fundingState: InstitutionalFundingState
  whaleBias: InstitutionalWhaleBias
  volumeState: InstitutionalVolumeState

  divergenceDetected: boolean
  absorptionDetected: boolean
  sweepDetected: boolean

  fmaiDirectionalPressure:
    InstitutionalDirectionalPressure

  oiDirectionalPressure:
    InstitutionalDirectionalPressure
}
