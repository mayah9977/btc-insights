// lib/market/institutional/server/institutionalEvidenceSample.ts

/**
 * Shared server-side institutional evidence sample consumed by both
 * the 30-minute and 1-hour accumulators.
 *
 * This module contains only immutable type contracts and a pure factory.
 * It does not perform accumulation, averaging, freezing, threshold checks,
 * pattern detection, or external I/O.
 */
export type InstitutionalEvidenceSample = Readonly<{
  sampledAt: number

  oiDelta: number
  oiExpansionVelocity: number
  oiCompressionVelocity: number
  oiTrendStrength: number
  oiDirectionalPersistence: number

  volumeRatio: number
  fundingRate: number

  whaleIntensity: number
  whaleNetRatio: number
  whaleRatio: number

  /**
   * Original FMAI score unit received from the existing calculation path.
   *
   * No scaling, clamping, normalization, defaulting, or direction conversion
   * is performed in this module.
   */
  fmai: number

  /**
   * Signed absorption value already converted upstream to the same numeric
   * contract used by the browser path.
   *
   * This module preserves the supplied value without changing its sign,
   * scale, or range.
   */
  absorption: number

  /**
   * Raw liquidity-sweep strength used by the browser contract.
   *
   * SWEEP_UP and SWEEP_DOWN must not cause direction-based sign conversion.
   * The supplied strength is preserved exactly as received.
   */
  sweep: number

  /**
   * The current browser MarketSnapshot does not expose volatilityShock.
   *
   * For browser-algorithm parity, the server sample contract fixes this field
   * to the literal value 0 and does not accept a server volatility input.
   */
  volatilityShock: 0
}>

export type CreateInstitutionalEvidenceSampleInput = Readonly<{
  sampledAt: number

  oiDelta: number
  oiExpansionVelocity: number
  oiCompressionVelocity: number
  oiTrendStrength: number
  oiDirectionalPersistence: number

  volumeRatio: number
  fundingRate: number

  whaleIntensity: number
  whaleNetRatio: number
  whaleRatio: number

  fmai: number
  absorption: number
  sweep: number
}>

/**
 * Creates one common 30-second institutional evidence sample.
 *
 * All supplied numeric values are copied without alteration. This function
 * does not clamp, normalize, scale, infer direction, or provide fallback
 * values.
 *
 * volatilityShock is always forced to the literal value 0 to preserve the
 * currently confirmed browser contract.
 */
export function createInstitutionalEvidenceSample(
  input: CreateInstitutionalEvidenceSampleInput,
): InstitutionalEvidenceSample {
  return Object.freeze({
    sampledAt: input.sampledAt,

    oiDelta: input.oiDelta,
    oiExpansionVelocity: input.oiExpansionVelocity,
    oiCompressionVelocity: input.oiCompressionVelocity,
    oiTrendStrength: input.oiTrendStrength,
    oiDirectionalPersistence: input.oiDirectionalPersistence,

    volumeRatio: input.volumeRatio,
    fundingRate: input.fundingRate,

    whaleIntensity: input.whaleIntensity,
    whaleNetRatio: input.whaleNetRatio,
    whaleRatio: input.whaleRatio,

    fmai: input.fmai,
    absorption: input.absorption,
    sweep: input.sweep,

    volatilityShock: 0,
  })
}
