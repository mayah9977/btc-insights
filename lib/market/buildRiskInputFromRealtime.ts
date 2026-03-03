'use server'

import {
  getLastPrice,
  getLastOI,
  getLastVolume,
  getPrevVolume,
  getLastFundingRate,
  getLastBollingerSignal,
  getLastMACD,

  getLastWhaleTradeUSD,
  getLastTotalTradeUSD,
  getLastWhaleBuyUSD,
  getLastWhaleSellUSD,
  getWhaleCVD,
} from '@/lib/market/marketLastStateStore'

import {
  getRollingMean,
  getRollingStd,
} from '@/lib/market/statsRolling'

import { calculateVolatilityFromCandles } from '@/lib/market/calcRealtimeVolatility'
import type { ActionGateInput } from '@/lib/market/actionGate/actionGateInput'
import type { BollingerSignalType } from '@/lib/market/actionGate/signalType'

/* ======================================================= */
/* 🔥 OI Snapshot Map (즉시 반응 구조 핵심) */
/* ======================================================= */

const lastSnapshotOIMap = new Map<string, number>()

/* ======================================================= */

export interface RealtimeRiskSnapshot extends ActionGateInput {
  price: number
  volatility: number
  whaleIntensity: number
  fundingRate: number

  openInterest: number
  prevOpenInterest: number
  oiDelta: number
  oiDeltaRatio: number

  volumeRatio: number

  fundingBias: 'LONG_HEAVY' | 'SHORT_HEAVY' | 'NEUTRAL'

  extremeSignal: boolean
  preExtreme: boolean
  marketPulse: 'ACCELERATING' | 'STABLE'

  whaleNetRatio: number
  whaleRatio: number

  whaleAvg: number
  whaleTrend: 'UP' | 'DOWN' | 'FLAT'

  whaleVolume: number
  totalVolume: number

  whaleBuyVolume: number
  whaleSellVolume: number
  whaleNetPressure: number

  whaleCVD: number

  tradeUSD: number
  ts: number
}

/* ======================================================= */

export async function buildRiskInputFromRealtime(
  symbol: string,
): Promise<RealtimeRiskSnapshot | null> {

  const price = getLastPrice(symbol)
  if (price == null || !Number.isFinite(price)) return null

  const volatilityRaw = await calculateVolatilityFromCandles(symbol)

  const volatility =
    volatilityRaw != null && Number.isFinite(volatilityRaw)
      ? volatilityRaw
      : 0

  /* ================= OI (🔥 즉시 반응 구조) ================= */

  const openInterest = getLastOI(symbol) ?? 0

  const prevSnapshotOI =
    lastSnapshotOIMap.get(symbol) ?? openInterest

  const oiDelta = openInterest - prevSnapshotOI

  const oiDeltaRatio =
    prevSnapshotOI !== 0
      ? oiDelta / prevSnapshotOI
      : 0

  // 🔥 스냅샷 업데이트
  lastSnapshotOIMap.set(symbol, openInterest)

  /* ================= Volume ================= */

  const lastVolume = getLastVolume(symbol) ?? 0
  const prevVolume = getPrevVolume(symbol)

  const safePrevVolume =
    prevVolume != null &&
    Number.isFinite(prevVolume) &&
    prevVolume !== 0
      ? prevVolume
      : lastVolume || 1

  const volumeRatio =
    safePrevVolume !== 0
      ? lastVolume / safePrevVolume
      : 1

  /* ================= Whale Intensity ================= */

  const oiEnergy = Math.min(1, Math.abs(oiDeltaRatio) * 15)
  const volumeEnergy = Math.min(1, Math.log(volumeRatio + 1) * 1.4)
  const volatilityEnergy = Math.min(1, volatility * 1.2)

  const rollingMean = getRollingMean(`OI_${symbol}`)
  const rollingStd = getRollingStd(`OI_${symbol}`)

  let driftEnergy = 0

  if (rollingMean && rollingStd && rollingStd > 0) {
    const drift =
      Math.abs(openInterest - rollingMean) /
      (rollingStd + 1e-6)

    driftEnergy = Math.min(1, drift * 0.6)
  }

  const whaleIntensity = Math.max(
    0,
    Math.min(
      1,
      0.35 * oiEnergy +
      0.30 * volumeEnergy +
      0.20 * volatilityEnergy +
      0.15 * driftEnergy
    ),
  )

  /* ================= Trade Flow ================= */

  const totalTradeUSD = getLastTotalTradeUSD(symbol) ?? 0
  const whaleTradeUSD = getLastWhaleTradeUSD(symbol) ?? 0

  const whaleBuyVolume = getLastWhaleBuyUSD(symbol) ?? 0
  const whaleSellVolume = getLastWhaleSellUSD(symbol) ?? 0

  const whaleRatio =
    totalTradeUSD > 0
      ? whaleTradeUSD / totalTradeUSD
      : 0

  const whaleNetPressureRaw =
    whaleBuyVolume - whaleSellVolume

  const whaleNetRatio =
    totalTradeUSD > 0
      ? whaleNetPressureRaw / totalTradeUSD
      : 0

  const whaleNetPressure =
    Math.max(-1, Math.min(1, whaleNetRatio))

  const whaleCVD = getWhaleCVD(symbol)

  /* ================= Funding ================= */

  const fundingRate = getLastFundingRate(symbol) ?? 0

  let fundingBias: 'LONG_HEAVY' | 'SHORT_HEAVY' | 'NEUTRAL' = 'NEUTRAL'

  if (fundingRate > 0.0015) fundingBias = 'LONG_HEAVY'
  else if (fundingRate < -0.0015) fundingBias = 'SHORT_HEAVY'

  /* ================= Risk Flags ================= */

  const extremeSignal =
    whaleRatio > 0.6 && whaleIntensity > 0.8

  const preExtreme =
    whaleRatio > 0.4

  const marketPulse =
    preExtreme ? 'ACCELERATING' : 'STABLE'

  /* ================= Bollinger ================= */

  const lastBB = getLastBollingerSignal(symbol)

  const bollingerSignal: BollingerSignalType | null =
    lastBB?.enabled
      ? (lastBB.signalType as BollingerSignalType)
      : null

  const whalePressure: ActionGateInput['whalePressure'] =
    whaleIntensity > 0.82
      ? 'EXTREME'
      : whaleIntensity > 0.60
        ? 'ELEVATED'
        : 'NORMAL'

  const macd = getLastMACD(symbol)

  return {
    price,
    volatility,
    whaleIntensity,
    fundingRate,

    openInterest,
    prevOpenInterest: prevSnapshotOI,
    oiDelta,
    oiDeltaRatio,

    volumeRatio,
    fundingBias,

    extremeSignal,
    preExtreme,
    marketPulse,

    bollingerSignal,
    whalePressure,
    macd,

    whaleNetRatio,
    whaleRatio,

    whaleAvg: 0,
    whaleTrend:
      whaleNetRatio > 0 ? 'UP' :
      whaleNetRatio < 0 ? 'DOWN' : 'FLAT',

    whaleVolume: whaleTradeUSD,
    totalVolume: totalTradeUSD,

    whaleBuyVolume,
    whaleSellVolume,
    whaleNetPressure,

    whaleCVD,

    tradeUSD: totalTradeUSD,

    ts: Date.now(),
  }
}
