/**
 * =========================
 * Market SSOT (In-Memory)
 * - SSE reconnect 시 REPLAY 용도
 * =========================
 */

/* =====================================================
 * 🔧 내부 유틸
 * ===================================================== */
function normalize(symbol: string) {
  return symbol?.toUpperCase()
}

function isValidNumber(v: any): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

/* =====================================================
 * OI / VOLUME (Last / Prev)
 * ===================================================== */
const lastOI = new Map<string, number>()
const prevOI = new Map<string, number>()

const lastVolume = new Map<string, number>()
const prevVolume = new Map<string, number>()

/* -------------------------
 * Open Interest
 * ------------------------- */
export function setLastOI(symbol: string, oi: number) {
  if (!isValidNumber(oi)) return

  const key = normalize(symbol)
  const last = lastOI.get(key)

  if (isValidNumber(last)) {
    prevOI.set(key, last)
  }

  lastOI.set(key, oi)
}

export function getLastOI(symbol: string) {
  return lastOI.get(normalize(symbol))
}

export function getPrevOI(symbol: string) {
  return prevOI.get(normalize(symbol))
}

/**
 * 🔥 Replay용 Drift 계산 포함 반환
 */
export function getLastOIDerived(symbol: string) {
  const key = normalize(symbol)
  const current = lastOI.get(key)
  const prev = prevOI.get(key)

  if (!isValidNumber(current)) return null

  const delta =
    isValidNumber(prev) ? current - prev : 0

  const direction =
    delta > 0
      ? 'UP'
      : delta < 0
      ? 'DOWN'
      : 'FLAT'

  return {
    openInterest: current,
    delta,
    direction,
  }
}

/* -------------------------
 * Volume
 * ------------------------- */
export function setLastVolume(symbol: string, volume: number) {
  if (!isValidNumber(volume)) return

  const key = normalize(symbol)
  const last = lastVolume.get(key)

  if (isValidNumber(last)) {
    prevVolume.set(key, last)
  }

  lastVolume.set(key, volume)
}

export function getLastVolume(symbol: string) {
  return lastVolume.get(normalize(symbol))
}

export function getPrevVolume(symbol: string) {
  return prevVolume.get(normalize(symbol))
}

/* =====================================================
 * Funding Rate
 * ===================================================== */
const lastFundingRateMap = new Map<string, number>()

export function setLastFundingRate(symbol: string, fundingRate: number) {
  if (!isValidNumber(fundingRate)) return
  lastFundingRateMap.set(normalize(symbol), fundingRate)
}

export function getLastFundingRate(symbol: string) {
  return lastFundingRateMap.get(normalize(symbol))
}

/* =====================================================
 * PRICE SSOT (Realtime FIFO)
 * ===================================================== */
const recentPriceMap = new Map<string, number[]>()
const MAX_PRICE_BUFFER = 200

export function pushRecentPrice(symbol: string, price: number) {
  if (!isValidNumber(price)) return

  const key = normalize(symbol)

  let arr = recentPriceMap.get(key)
  if (!arr) {
    arr = []
    recentPriceMap.set(key, arr)
  }

  arr.push(price)

  if (arr.length > MAX_PRICE_BUFFER) {
    arr.shift()
  }
}

export function getRecentPrices(symbol: string, n: number): number[] {
  const arr = recentPriceMap.get(normalize(symbol))
  if (!arr || arr.length < n) return []
  return arr.slice(-n)
}

export function getLastPrice(symbol: string): number | undefined {
  const arr = recentPriceMap.get(normalize(symbol))
  if (!arr || arr.length === 0) return undefined
  return arr[arr.length - 1]
}

/* =====================================================
 * 🔥 BB_SIGNAL SSOT
 * ===================================================== */
import type { BollingerSignal } from '@/lib/market/actionGate/signalType'

const lastBollingerSignalMap = new Map<
  string,
  BollingerSignal | null
>()

export function setLastBollingerSignal(
  symbol: string,
  signal: BollingerSignal,
) {
  lastBollingerSignalMap.set(normalize(symbol), signal)
}

export function getLastBollingerSignal(
  symbol: string,
): BollingerSignal | null {
  return (
    lastBollingerSignalMap.get(normalize(symbol)) ?? null
  )
}

/* =====================================================
 * Action Gate SSOT
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
  actionGateStateMap.set(normalize(symbol), state)
}

export function getActionGateState(symbol: string) {
  return actionGateStateMap.get(normalize(symbol))
}

export function setLastActionGateInput(
  symbol: string,
  input: any,
) {
  lastActionGateInputMap.set(normalize(symbol), input)
}

export function getLastActionGateInput(symbol: string) {
  return lastActionGateInputMap.get(normalize(symbol))
}
