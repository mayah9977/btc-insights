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
  if (!Number.isFinite(recentVolume) || !Number.isFinite(avgVolume) || avgVolume === 0) {
    return false
  }

  return recentVolume >= avgVolume * 1.3
}

export function isLargeTrade(
  recentVolume: number,
  avgVolume: number,
): boolean {
  if (!Number.isFinite(recentVolume) || !Number.isFinite(avgVolume) || avgVolume === 0) {
    return false
  }

  return recentVolume >= avgVolume * 2.2
}

/**
 * =========================
 * 🐋 Whale detection (실전 반응형 기준)
 * =========================
 * - OI 1.8% 이상 변화
 * - Volume 2.5배 이상 (detectOrderbookWhale 내부 기준)
 */
export function detectWhale(input: WhaleInput): boolean {
  if (
    !Number.isFinite(input.prevOI) ||
    !Number.isFinite(input.currentOI) ||
    !Number.isFinite(input.recentVolume) ||
    !Number.isFinite(input.avgVolume)
  ) {
    return false
  }

  const oiDeltaPercent = calcOIDelta(
    input.prevOI,
    input.currentOI,
  )

  const orderbookSpike = detectOrderbookWhale(
    input.recentVolume,
    input.avgVolume,
  )

  const OI_THRESHOLD = 1.8 // 🔥 기존 3 → 1.8%

  return oiDeltaPercent >= OI_THRESHOLD && orderbookSpike
}
