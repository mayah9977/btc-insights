/* =========================================================
 Numeric Narrative Builder (FINAL - STRUCTURED REALTIME)
========================================================= */

import { MarketSnapshot } from '@/lib/market/engine/marketSnapshot'
import { MarketSignal } from '@/lib/market/signalEngine'

/* =========================================================
 Utils
========================================================= */

function safeNum(n?: number, digits = 2): string {
  if (n === undefined || n === null || isNaN(n)) return '--'
  return n.toFixed(digits)
}

function sign(n?: number): string {
  if (n === undefined || n === null || isNaN(n)) return '--'
  if (n === 0) return '0'
  if (n > 0) return `+${safeNum(n)}`
  return safeNum(n)
}

/* 🔥 핵심 수정 (지수표기 제거) */
function safeFunding(n?: number): string {
  if (n === undefined || n === null || isNaN(n)) return '--'

  return `${(n * 100).toFixed(4)}%`
}

/* =========================================================
 0️⃣ Situation (raw data view)
========================================================= */
export function buildSituation(snapshot: MarketSnapshot): string {
  return [
    `OI ${sign(snapshot.oiDelta)}`,
    `Vol ${safeNum(snapshot.volumeRatio)}x`,
    `Funding ${safeFunding(snapshot.fundingRate)}`,
    `Whale ${safeNum(snapshot.whaleNetRatio, 3)}`,
  ].join(' / ')
}

/* =========================================================
 1️⃣ Cause
========================================================= */
export function buildCause(params: {
  snapshot: MarketSnapshot
  causeSignals: any[]
}): string {

  const { snapshot, causeSignals } = params

  const stateParts: string[] = []
  const signalParts: string[] = []

  if (snapshot.oiDelta > 0) {
    stateParts.push(`OI 증가(${safeNum(snapshot.oiDelta)})`)
  } else if (snapshot.oiDelta < 0) {
    stateParts.push(`OI 감소(${safeNum(snapshot.oiDelta)})`)
  } else {
    stateParts.push(`OI 정체(0)`)
  }

  if (snapshot.fundingRate > 0) {
    stateParts.push(`Funding 양수(${safeFunding(snapshot.fundingRate)})`)
  } else if (snapshot.fundingRate < 0) {
    stateParts.push(`Funding 음수(${safeFunding(snapshot.fundingRate)})`)
  } else {
    stateParts.push(`Funding 중립(0.0000)`)
  }

  if (snapshot.volumeRatio > 1) {
    stateParts.push(`거래량 증가(${safeNum(snapshot.volumeRatio)}x)`)
  } else if (snapshot.volumeRatio < 1) {
    stateParts.push(`거래량 감소(${safeNum(snapshot.volumeRatio)}x)`)
  } else {
    stateParts.push(`거래량 정체(1.00x)`)
  }

  if (snapshot.whaleNetRatio > 0) {
    stateParts.push(`Whale 매집(${safeNum(snapshot.whaleNetRatio, 3)})`)
  } else if (snapshot.whaleNetRatio < 0) {
    stateParts.push(`Whale 분배(${safeNum(snapshot.whaleNetRatio, 3)})`)
  } else {
    stateParts.push(`Whale 중립(0.000)`)
  }

  if (causeSignals?.length) {
    for (const s of causeSignals) {
      if (!s) continue

      if (typeof s === 'string') {
        signalParts.push(s)
      } else if (typeof s === 'object') {
        signalParts.push(s.text || s.label || s.type)
      }
    }
  }

  const base = stateParts.join(' / ')

  if (signalParts.length > 0) {
    return `${base} → ${signalParts.join(' / ')}`
  }

  return base
}

/* =========================================================
 3️⃣ Risk
========================================================= */
export function buildRisk(params: {
  snapshot: MarketSnapshot
  signal: MarketSignal
}): string {

  const { snapshot, signal } = params

  const parts: string[] = []

  parts.push(`Risk ${signal.riskLevel.toUpperCase()}`)

  if (snapshot.volumeRatio > 1.1) {
    parts.push(`Volatile`)
  }

  if (snapshot.volumeRatio > 1.2 && snapshot.oiDelta < 0) {
    parts.push(`Liquidation`)
  }

  return parts.join(' / ')
}

/* =========================================================
 4️⃣ Compact Summary
========================================================= */
export function buildCompactSummary(snapshot: MarketSnapshot): string {
  return [
    `OI ${sign(snapshot.oiDelta)}`,
    `Vol ${safeNum(snapshot.volumeRatio)}x`,
    `Funding ${safeFunding(snapshot.fundingRate)}`
  ].join(' / ')
}
