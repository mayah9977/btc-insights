import { calcOIDelta } from "./exchange/calcOIDelta"
import { detectOrderbookWhale } from "./exchange/detectOrderbookWhale"

type WhaleInput = {
  prevOI: number
  currentOI: number
  recentVolume: number
  avgVolume: number
}

/**
 * =========================
 * 🔍 Trade size helpers
 * =========================
 * - EXTREME / HIGH 판정과 직접 연결 ❌
 * - Density / pressure 계산용
 */
export function isMediumTrade(
  recentVolume: number,
  avgVolume: number,
): boolean {
  return recentVolume >= avgVolume * 1.3
}

export function isLargeTrade(
  recentVolume: number,
  avgVolume: number,
): boolean {
  return recentVolume >= avgVolume * 2.2
}

/**
 * =========================
 * 🐋 Whale detection (unchanged behavior)
 * =========================
 * - 기존 EXTREME / HIGH 판정 기준 유지
 */
export function detectWhale(input: WhaleInput): boolean {
  const oiDelta = calcOIDelta(input.prevOI, input.currentOI)

  const orderbookSpike = detectOrderbookWhale(
    input.recentVolume,
    input.avgVolume,
  )

  return oiDelta >= 3 && orderbookSpike
}
