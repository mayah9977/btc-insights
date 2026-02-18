'use server'

import {
  getLastPrice,
  getLastOI,
  getPrevOI,
  getLastVolume,
  getPrevVolume,
  getLastFundingRate,
  getLastBollingerSignal,
} from '@/lib/market/marketLastStateStore'

import {
  getRollingMean,
  getRollingStd,
} from '@/lib/market/statsRolling'

import { calculateVolatilityFromCandles } from '@/lib/market/calcRealtimeVolatility'
import { detectWhale } from '@/lib/detectWhale'
import { deriveBollingerObservation } from '@/lib/market/actionGate/deriveBollingerObservation'
import type { ActionGateInput } from '@/lib/market/actionGate/actionGateInput'

/* =======================================================
   🔥 확장된 Snapshot 타입
======================================================= */

export interface RealtimeRiskSnapshot extends ActionGateInput {
  /* 기본 */
  price: number
  volatility: number
  whaleIntensity: number
  fundingRate: number

  /* 🔥 추가 확장 */
  openInterest: number
  prevOpenInterest: number
  oiDeltaRatio: number
  volumeRatio: number
  fundingBias: 'LONG_HEAVY' | 'SHORT_HEAVY' | 'NEUTRAL'

  /* 리스크 */
  extremeSignal: boolean
  preExtreme: boolean
  marketPulse: 'ACCELERATING' | 'STABLE'

  ts: number
}

export async function buildRiskInputFromRealtime(
  symbol: string,
): Promise<RealtimeRiskSnapshot | null> {

  /* ================= PRICE ================= */

  const priceRaw = getLastPrice(symbol)
  if (priceRaw == null || !Number.isFinite(priceRaw)) return null
  const price = priceRaw

  /* ================= VOLATILITY ================= */

  const volatilityRaw = await calculateVolatilityFromCandles(symbol)
  if (volatilityRaw == null || !Number.isFinite(volatilityRaw)) return null
  const volatility = volatilityRaw

  /* ================= OI ================= */

  const lastOIRaw = getLastOI(symbol)
  const prevOIRaw = getPrevOI(symbol)

  if (
    lastOIRaw == null ||
    prevOIRaw == null ||
    !Number.isFinite(lastOIRaw) ||
    !Number.isFinite(prevOIRaw) ||
    prevOIRaw === 0
  ) return null

  const openInterest = lastOIRaw
  const prevOpenInterest = prevOIRaw

  const oiDeltaRatio =
    (openInterest - prevOpenInterest) /
    prevOpenInterest

  const oiEnergy =
    Math.tanh(Math.abs(oiDeltaRatio) * 2.4)

  /* ================= VOLUME ================= */

  const lastVolumeRaw = getLastVolume(symbol)
  const prevVolumeRaw = getPrevVolume(symbol)

  if (
    lastVolumeRaw == null ||
    prevVolumeRaw == null ||
    !Number.isFinite(lastVolumeRaw) ||
    !Number.isFinite(prevVolumeRaw) ||
    prevVolumeRaw === 0
  ) return null

  const volumeRatio = lastVolumeRaw / prevVolumeRaw

  const volumeEnergy =
    Math.tanh(Math.sqrt(volumeRatio) * 1.6)

  /* ================= VOLATILITY ENERGY ================= */

  const volatilityEnergy =
    1 - Math.exp(-volatility * 3.2)

  /* ================= DRIFT ================= */

  const rollingMean = getRollingMean(`OI_${symbol}`)
  const rollingStd = getRollingStd(`OI_${symbol}`)

  let driftEnergy = 0

  if (
    rollingMean != null &&
    rollingStd != null &&
    rollingStd > 0
  ) {
    const drift =
      Math.abs(openInterest - rollingMean) /
      (rollingStd + 1e-6)

    driftEnergy = Math.tanh(drift * 1.4)
  }

  /* ================= RAW INTENSITY ================= */

  const raw =
    0.32 * oiEnergy +
    0.28 * volumeEnergy +
    0.22 * volatilityEnergy +
    0.18 * driftEnergy

  const baseIntensity =
    Math.tanh(raw * 1.2)

  const microPulse =
    0.015 * Math.sin(Date.now() / 2000)

  const whaleIntensity =
    Math.max(
      0.03,
      Math.min(1, baseIntensity + microPulse),
    )

  /* ================= WHALE DETECT ================= */

  const whaleDetected = detectWhale({
    prevOI: prevOpenInterest,
    currentOI: openInterest,
    recentVolume: lastVolumeRaw,
    avgVolume: prevVolumeRaw,
  })

  /* ================= EXTREME ================= */

  const extremeSignal =
    whaleDetected &&
    whaleIntensity > 0.85 &&
    volatility > 0.6

  const preExtreme =
    whaleIntensity > 0.65 &&
    volatility > 0.45

  const marketPulse =
    preExtreme ? 'ACCELERATING' : 'STABLE'

  /* ================= BB ================= */

  const lastBB = getLastBollingerSignal(symbol)

  const bollingerObservation = lastBB?.enabled
    ? deriveBollingerObservation(lastBB.signalType)
    : { bollingerRegime: 'NEUTRAL' as const }

  /* ================= FUNDING ================= */

  const fundingRaw = getLastFundingRate(symbol)
  const fundingRate =
    fundingRaw != null && Number.isFinite(fundingRaw)
      ? fundingRaw
      : 0

  let fundingBias: 'LONG_HEAVY' | 'SHORT_HEAVY' | 'NEUTRAL'

  if (fundingRate > 0.0005) fundingBias = 'LONG_HEAVY'
  else if (fundingRate < -0.0005) fundingBias = 'SHORT_HEAVY'
  else fundingBias = 'NEUTRAL'

  /* ================= ACTION GATE ================= */

  const whalePressure: ActionGateInput['whalePressure'] =
    whaleIntensity > 0.55 ? 'ELEVATED' : 'NORMAL'

  const participationState: ActionGateInput['participationState'] =
    volumeEnergy > 0.3 && oiEnergy > 0.2
      ? 'HEALTHY'
      : 'WEAKENING'

  return {
    price,
    volatility,
    whaleIntensity,
    fundingRate,

    /* 🔥 확장 */
    openInterest,
    prevOpenInterest,
    oiDeltaRatio,
    volumeRatio,
    fundingBias,

    extremeSignal,
    preExtreme,
    marketPulse,

    whalePressure,
    participationState,
    bollingerRegime:
      bollingerObservation.bollingerRegime,
    elliott: { possible: true },
    trend: { valid: true },
    fibonacci: { overextended: false },
    momentum: { valid: true },

    ts: Date.now(),
  }
}
