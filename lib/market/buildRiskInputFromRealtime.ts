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

/* 🔥 WhaleIntensity v2 import */
import { calculateWhaleIntensityV2 } from '@/lib/market/whaleIntensityV2'

/* ======================================================= */
/* 🔥 OI Snapshot Map */
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

  /* ================= OI ================= */

  const openInterest = getLastOI(symbol) ?? 0

  const prevSnapshotOI =
    lastSnapshotOIMap.get(symbol) ?? openInterest

  const oiDelta = openInterest - prevSnapshotOI

  const oiDeltaRatio =
    prevSnapshotOI !== 0
      ? oiDelta / prevSnapshotOI
      : 0

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

  /* =======================================================
     🔥 Drift 계산 (WhaleIntensity v2 입력값)
  ======================================================= */

  const rollingMean = getRollingMean(`OI_${symbol}`)
  const rollingStd = getRollingStd(`OI_${symbol}`)

  let drift = 0

  if (rollingMean && rollingStd && rollingStd > 0) {
    drift =
      Math.abs(openInterest - rollingMean) /
      (rollingStd + 1e-6)
  }

  /* =======================================================
     🔥 WhaleIntensity v2 계산
  ======================================================= */

  const { intensity: whaleIntensity } =
    calculateWhaleIntensityV2({
      oiDeltaRatio,
      volumeRatio,
      volatility,
      drift,
    })

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

  /* =======================================================
     🔥 Spike 기준
  ======================================================= */

  const extremeSignal =
    whaleRatio > 0.45 && whaleIntensity > 65

  const preExtreme =
    whaleRatio > 0.30

  const marketPulse =
    preExtreme ? 'ACCELERATING' : 'STABLE'

  /* ================= Bollinger ================= */

  const lastBB = getLastBollingerSignal(symbol)

  const bollingerSignal: BollingerSignalType | null =
    lastBB?.enabled
      ? (lastBB.signalType as BollingerSignalType)
      : null

  const whalePressure: ActionGateInput['whalePressure'] =
    whaleIntensity > 85
      ? 'EXTREME'
      : whaleIntensity > 60
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
      whaleNetRatio > 0 ? 'UP'
      : whaleNetRatio < 0 ? 'DOWN'
      : 'FLAT',

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
