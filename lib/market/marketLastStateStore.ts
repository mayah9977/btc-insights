/**
 * =========================
 * Market SSOT (In-Memory)
 * - SSE reconnect 시 REPLAY 용도
 * =========================
 */

/* =====================================================
 * OI / VOLUME (Last / Prev)
 * ===================================================== */
const lastOI = new Map<string, number>()
const lastVolume = new Map<string, number>()

const prevOI = new Map<string, number>()
const prevVolume = new Map<string, number>()

/* -------------------------
 * Open Interest
 * ------------------------- */
export function setLastOI(symbol: string, oi: number) {
  const last = lastOI.get(symbol)
  if (Number.isFinite(last)) {
    prevOI.set(symbol, last as number)
  }
  lastOI.set(symbol, oi)
}

export function getLastOI(symbol: string) {
  return lastOI.get(symbol)
}

export function getPrevOI(symbol: string) {
  return prevOI.get(symbol)
}

/* -------------------------
 * Volume
 * ------------------------- */
export function setLastVolume(symbol: string, volume: number) {
  const last = lastVolume.get(symbol)
  if (Number.isFinite(last)) {
    prevVolume.set(symbol, last as number)
  }
  lastVolume.set(symbol, volume)
}

export function getLastVolume(symbol: string) {
  return lastVolume.get(symbol)
}

export function getPrevVolume(symbol: string) {
  return prevVolume.get(symbol)
}

/* =====================================================
 * Funding Rate
 * ===================================================== */
const lastFundingRateMap = new Map<string, number>()

export function setLastFundingRate(symbol: string, fundingRate: number) {
  lastFundingRateMap.set(symbol, fundingRate)
}

export function getLastFundingRate(symbol: string) {
  return lastFundingRateMap.get(symbol)
}

/* =====================================================
 * PRICE SSOT (Realtime FIFO)
 * ===================================================== */
const recentPriceMap = new Map<string, number[]>()
const MAX_PRICE_BUFFER = 200

export function pushRecentPrice(symbol: string, price: number) {
  if (!Number.isFinite(price)) return

  let arr = recentPriceMap.get(symbol)
  if (!arr) {
    arr = []
    recentPriceMap.set(symbol, arr)
  }

  arr.push(price)

  if (arr.length > MAX_PRICE_BUFFER) {
    arr.shift()
  }
}

export function getRecentPrices(
  symbol: string,
  n: number,
): number[] {
  const arr = recentPriceMap.get(symbol)
  if (!arr || arr.length < n) return []
  return arr.slice(-n)
}

export function getLastPrice(symbol: string): number | undefined {
  const arr = recentPriceMap.get(symbol)
  if (!arr || arr.length === 0) return undefined
  return arr[arr.length - 1]
}

/* =====================================================
 * 🔥 BB_SIGNAL SSOT (ADD)
 * ===================================================== */
import type { BollingerSignal } from '@/lib/market/actionGate/signalType'

// symbol → last confirmed BB_SIGNAL
const lastBollingerSignalMap = new Map<
  string,
  BollingerSignal | null
>()

/**
 * 저장
 * - marketRealtimeConsumer 에서 호출
 */
export function setLastBollingerSignal(
  symbol: string,
  signal: BollingerSignal,
) {
  lastBollingerSignalMap.set(symbol, signal)
}

/**
 * 조회
 * - buildRiskInputFromRealtime 에서 사용
 */
export function getLastBollingerSignal(
  symbol: string,
): BollingerSignal | null {
  return lastBollingerSignalMap.get(symbol) ?? null
}

/* =====================================================
 * Action Gate SSOT (Interpretation Authority)
 * ===================================================== */
const actionGateStateMap = new Map<
  string,
  'OBSERVE' | 'CAUTION' | 'IGNORE'
>()

const lastActionGateInputMap = new Map<string, any>()

export function setActionGateState(
  symbol: string,
  state: 'OBSERVE' | 'CAUTION' | 'IGNORE',
) {
  actionGateStateMap.set(symbol, state)
}

export function getActionGateState(symbol: string) {
  return actionGateStateMap.get(symbol)
}

export function setLastActionGateInput(
  symbol: string,
  input: any,
) {
  lastActionGateInputMap.set(symbol, input)
}

export function getLastActionGateInput(symbol: string) {
  return lastActionGateInputMap.get(symbol)
}
