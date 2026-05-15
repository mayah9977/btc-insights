// lib/market/institutional/institutionalEvidenceSnapshot.ts

export type InstitutionalDominantFlow =
  | 'LONG'
  | 'SHORT'
  | 'NEUTRAL'

export type InstitutionalFundingState =
  | 'LONG_OVERHEATED'
  | 'SHORT_OVERHEATED'
  | 'NEUTRAL'

export type InstitutionalWhaleBias =
  | 'ACCUMULATION'
  | 'DISTRIBUTION'
  | 'NEUTRAL'

export type InstitutionalVolumeState =
  | 'EXPANSION'
  | 'WEAK'
  | 'NORMAL'

export type InstitutionalDirectionalPressure =
  | 'LONG'
  | 'SHORT'
  | 'NEUTRAL'

export interface InstitutionalEventsSnapshot {
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

export interface InstitutionalEvidenceSnapshot {
  /**
   * 🔥 freeze metadata
   */
  timeframe: '30m'
  confirmedCandleTs: number

  /**
   * 🔥 persisted ENUM phase ownership metadata
   *
   * Optional for backward compatibility with
   * previously persisted snapshots.
   */
  confirmedSignalType?: string

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

  institutionalEvents: InstitutionalEventsSnapshot
}
