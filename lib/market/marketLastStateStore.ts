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
 * 🔥 FINAL_DECISION SSOT (⭐ 추가됨)
 * ===================================================== */

import type { FinalDecision } from '@/lib/market/actionGate/decisionEngine'

type FinalDecisionSnapshot = {
  decision: FinalDecision
  dominant: 'LONG' | 'SHORT' | 'NONE'
  confidence: number
}

const lastFinalDecisionMap = new Map<string, FinalDecisionSnapshot>()

export function setLastFinalDecision(
  symbol: string,
  decision: FinalDecision,
  dominant: 'LONG' | 'SHORT' | 'NONE',
  confidence: number,
) {
  lastFinalDecisionMap.set(normalize(symbol), {
    decision,
    dominant,
    confidence,
  })
}

export function getLastFinalDecision(symbol: string) {
  return lastFinalDecisionMap.get(normalize(symbol))
}

/* =====================================================
 * OI / VOLUME (Last / Prev)
 * ===================================================== */
const lastOI = new Map<string, number>()
const prevOI = new Map<string, number>()

const lastVolume = new Map<string, number>()
const prevVolume = new Map<string, number>()

export function setLastOI(symbol: string, oi: number) {
  if (!isValidNumber(oi)) return
  const key = normalize(symbol)
  const last = lastOI.get(key)
  if (isValidNumber(last)) prevOI.set(key, last)
  lastOI.set(key, oi)
}

export function getLastOI(symbol: string) {
  return lastOI.get(normalize(symbol))
}

export function getPrevOI(symbol: string) {
  return prevOI.get(normalize(symbol))
}

export function setLastVolume(symbol: string, volume: number) {
  if (!isValidNumber(volume)) return
  const key = normalize(symbol)
  const last = lastVolume.get(key)
  if (isValidNumber(last)) prevVolume.set(key, last)
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
 * 🔥 MACD SSOT
 * ===================================================== */
import type { MACDResult } from '@/lib/market/macd'

const lastMACDMap = new Map<string, MACDResult>()

export function setLastMACD(symbol: string, macd: MACDResult) {
  if (!macd) return
  lastMACDMap.set(normalize(symbol), macd)
}

export function getLastMACD(symbol: string): MACDResult | null {
  return lastMACDMap.get(normalize(symbol)) ?? null
}

/* =====================================================
 * PRICE SSOT
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
  if (arr.length > MAX_PRICE_BUFFER) arr.shift()
}

export function getRecentPrices(symbol: string, n: number): number[] {
  const arr = recentPriceMap.get(normalize(symbol))
  if (!arr || arr.length < n) return []
  return arr.slice(-n)
}

export function getLastPrice(symbol: string): number | undefined {
  const arr = recentPriceMap.get(normalize(symbol))
  if (!arr?.length) return undefined
  return arr[arr.length - 1]
}

/* =====================================================
 * 🔥 Bollinger SSOT
 * ===================================================== */
import type { BollingerSignal } from '@/lib/market/actionGate/signalType'

const lastBollingerSignalMap = new Map<string, BollingerSignal | null>()

export function setLastBollingerSignal(
  symbol: string,
  signal: BollingerSignal,
) {
  lastBollingerSignalMap.set(normalize(symbol), signal)
}

export function getLastBollingerSignal(
  symbol: string,
): BollingerSignal | null {
  return lastBollingerSignalMap.get(normalize(symbol)) ?? null
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

export function setLastActionGateInput(symbol: string, input: any) {
  lastActionGateInputMap.set(normalize(symbol), input)
}

export function getLastActionGateInput(symbol: string) {
  return lastActionGateInputMap.get(normalize(symbol))
}

/* =====================================================
 * Whale USD SSOT
 * ===================================================== */
const totalTradeUSDMap = new Map<string, number>()
const whaleTradeUSDMap = new Map<string, number>()
const whaleBuyUSDMap = new Map<string, number>()
const whaleSellUSDMap = new Map<string, number>()

export function setLastTradeUSD(symbol: string, value: number) {
  if (!isValidNumber(value)) return
  totalTradeUSDMap.set(normalize(symbol), value)
}

export function setLastWhaleTradeUSD(symbol: string, value: number) {
  if (!isValidNumber(value)) return
  whaleTradeUSDMap.set(normalize(symbol), value)
}

export function setLastWhaleBuyUSD(symbol: string, value: number) {
  if (!isValidNumber(value)) return
  whaleBuyUSDMap.set(normalize(symbol), value)
}

export function setLastWhaleSellUSD(symbol: string, value: number) {
  if (!isValidNumber(value)) return
  whaleSellUSDMap.set(normalize(symbol), value)
}

export function getLastTotalTradeUSD(symbol: string) {
  return totalTradeUSDMap.get(normalize(symbol)) ?? 0
}

export function getLastWhaleTradeUSD(symbol: string) {
  return whaleTradeUSDMap.get(normalize(symbol)) ?? 0
}

export function getLastWhaleBuyUSD(symbol: string) {
  return whaleBuyUSDMap.get(normalize(symbol)) ?? 0
}

export function getLastWhaleSellUSD(symbol: string) {
  return whaleSellUSDMap.get(normalize(symbol)) ?? 0
}

/* =====================================================
 * Whale CVD
 * ===================================================== */
const whaleCVDMap = new Map<string, number>()

export function updateWhaleCVD(symbol: string, netUSD: number) {
  if (!isValidNumber(netUSD)) return
  const key = normalize(symbol)
  const prev = whaleCVDMap.get(key) ?? 0
  whaleCVDMap.set(key, prev + netUSD)
}

export function getWhaleCVD(symbol: string) {
  return whaleCVDMap.get(normalize(symbol)) ?? 0
}
