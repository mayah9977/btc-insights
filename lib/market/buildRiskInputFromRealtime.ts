//lib/market/buildRiskInputFromRealtime.ts   

'use server'

import {
  getLastPrice,
  getLastOI,
  getLastVolume,
  getPrevVolume,
  getRecentVolumes,
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
const lastSnapshotOITsMap = new Map<string, number>()

const OI_DELTA_WINDOW_MS = 15000

const oiDeltaHistoryMap = new Map<string, number[]>()
const volatilityHistoryMap = new Map<string, number[]>()

const whaleIntensityEmaMap = new Map<string, number>()
const whaleStrongConfirmMap = new Map<string, number>()

const MAX_FEATURE_HISTORY = 60

const WHALE_INTENSITY_EMA_ALPHA = 0.25
const WHALE_STRONG_LEVEL = 60
const WHALE_STRONG_CONFIRM_COUNT = 3

const MIN_TOTAL_VOLUME_USD = 500_000
const MIN_WHALE_VOLUME_USD = 100_000

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

  const volatilityHistory =
    volatilityHistoryMap.get(symbol) ?? []

  volatilityHistory.push(volatility)

  if (volatilityHistory.length > MAX_FEATURE_HISTORY) {
    volatilityHistory.shift()
  }

  volatilityHistoryMap.set(symbol, volatilityHistory)

  const rollingVolatilityAvg =
    volatilityHistory.length > 1
      ? volatilityHistory
          .slice(0, -1)
          .reduce((a, b) => a + b, 0) /
        Math.max(volatilityHistory.length - 1, 1)
      : 0

  const volatilityShock =
    rollingVolatilityAvg > 0
      ? volatility / rollingVolatilityAvg
      : 0

  /* ================= OI ================= */

  const openInterest = getLastOI(symbol) ?? 0

  const nowForOI = Date.now()

  const prevSnapshotOI =
    lastSnapshotOIMap.get(symbol) ?? openInterest

  const oiDelta = openInterest - prevSnapshotOI

  const oiDeltaHistory =
    oiDeltaHistoryMap.get(symbol) ?? []

  oiDeltaHistory.push(Math.abs(oiDelta))

  if (oiDeltaHistory.length > MAX_FEATURE_HISTORY) {
    oiDeltaHistory.shift()
  }

  oiDeltaHistoryMap.set(symbol, oiDeltaHistory)

  const rollingAbsOIDeltaAvg =
    oiDeltaHistory.length > 1
      ? oiDeltaHistory
          .slice(0, -1)
          .reduce((a, b) => a + b, 0) /
        Math.max(oiDeltaHistory.length - 1, 1)
      : 0

  const oiDeltaRatio =
    rollingAbsOIDeltaAvg > 0
      ? Math.abs(oiDelta) / rollingAbsOIDeltaAvg
      : 0

  const lastOITs =
    lastSnapshotOITsMap.get(symbol) ?? 0

  if (nowForOI - lastOITs >= OI_DELTA_WINDOW_MS) {
    lastSnapshotOIMap.set(symbol, openInterest)
    lastSnapshotOITsMap.set(symbol, nowForOI)
  }

  /* ================= Volume ================= */

  const lastVolume = getLastVolume(symbol) ?? 0
  const prevVolume = getPrevVolume(symbol)

  const recentVolumes = getRecentVolumes(symbol, 20)

  const rollingVolumeAvg =
    recentVolumes.length > 1
      ? recentVolumes
          .slice(0, -1)
          .reduce((a, b) => a + b, 0) /
        Math.max(recentVolumes.length - 1, 1)
      : 0

  const safePrevVolume =
    rollingVolumeAvg > 0
      ? rollingVolumeAvg
      : prevVolume != null &&
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

  const { intensity: rawWhaleIntensity } =
    calculateWhaleIntensityV2({
      oiDeltaRatio,
      volumeRatio,
      volatility: volatilityShock,
      drift,
    })

  const prevEma =
    whaleIntensityEmaMap.get(symbol) ?? rawWhaleIntensity

  const smoothedWhaleIntensity =
    prevEma * (1 - WHALE_INTENSITY_EMA_ALPHA) +
    rawWhaleIntensity * WHALE_INTENSITY_EMA_ALPHA

  whaleIntensityEmaMap.set(symbol, smoothedWhaleIntensity)

  const prevConfirm =
    whaleStrongConfirmMap.get(symbol) ?? 0

  const nextConfirm =
    smoothedWhaleIntensity >= WHALE_STRONG_LEVEL
      ? prevConfirm + 1
      : 0

  whaleStrongConfirmMap.set(symbol, nextConfirm)

  const whaleIntensity =
    nextConfirm >= WHALE_STRONG_CONFIRM_COUNT
      ? smoothedWhaleIntensity
      : Math.min(smoothedWhaleIntensity, WHALE_STRONG_LEVEL - 1)

  console.log(
    '[RealtimeRiskSnapshot]',
    {
      symbol,

      openInterest,
      prevSnapshotOI,

      oiDelta,
      oiDeltaRatio,
      rollingAbsOIDeltaAvg,

      lastVolume,
      prevVolume,
      recentVolumes,
      rollingVolumeAvg,
      volumeRatio,

      volatilityRaw,
      volatility,
      volatilityShock,
      rollingVolatilityAvg,

      rollingMean,
      rollingStd,
      drift,

      rawWhaleIntensity,
      whaleIntensity,
    },
  )

  /* ================= Trade Flow ================= */

  const totalTradeUSD = getLastTotalTradeUSD(symbol) ?? 0
  const whaleTradeUSD = getLastWhaleTradeUSD(symbol) ?? 0

  const whaleBuyVolume = getLastWhaleBuyUSD(symbol) ?? 0
  const whaleSellVolume = getLastWhaleSellUSD(symbol) ?? 0

  const validWhaleBase =
    totalTradeUSD >= MIN_TOTAL_VOLUME_USD &&
    whaleTradeUSD >= MIN_WHALE_VOLUME_USD

  const whaleRatio =
    validWhaleBase
      ? whaleTradeUSD / totalTradeUSD
      : 0

  const whaleNetPressureRaw =
    whaleBuyVolume - whaleSellVolume

  const whaleNetRatio =
    validWhaleBase
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
