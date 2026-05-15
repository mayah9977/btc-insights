/* =========================================================
 Numeric Narrative Builder
 FINALIZED SNAPSHOT OWNERSHIP SAFE
========================================================= */

import { MarketSnapshot } from '@/lib/market/engine/marketSnapshot'
import { MarketSignal } from '@/lib/market/signalEngine'

type FinalizedMetricSnapshot = Partial<MarketSnapshot> & {
  oiDeltaAccum?: number
  fundingAverage?: number
  volumeRatioAverage?: number
  whaleNetRatioAverage?: number
}

function safeNum(n?: number, digits = 2): string {
  if (n === undefined || n === null || isNaN(n)) return '--'
  return n.toFixed(digits)
}

function sign(n?: number, digits = 2): string {
  if (n === undefined || n === null || isNaN(n)) return '--'
  if (n === 0) return '0'
  if (n > 0) return `+${safeNum(n, digits)}`
  return safeNum(n, digits)
}

function safeFunding(n?: number): string {
  if (n === undefined || n === null || isNaN(n)) return '--'
  return `${(n * 100).toFixed(4)}%`
}

function getFinalizedMetrics(snapshot: FinalizedMetricSnapshot) {
  return {
    oiDelta:
      snapshot.oiDeltaAccum ??
      snapshot.oiDelta ??
      0,

    fundingRate:
      snapshot.fundingAverage ??
      snapshot.fundingRate ??
      0,

    volumeRatio:
      snapshot.volumeRatioAverage ??
      snapshot.volumeRatio ??
      1,

    whaleNetRatio:
      snapshot.whaleNetRatioAverage ??
      snapshot.whaleNetRatio ??
      0,
  }
}

export function buildSituation(
  snapshot: FinalizedMetricSnapshot,
): string {
  const metrics = getFinalizedMetrics(snapshot)

  return [
    `OI ${sign(metrics.oiDelta)}`,
    `Vol ${safeNum(metrics.volumeRatio)}x`,
    `Funding ${safeFunding(metrics.fundingRate)}`,
    `Whale ${safeNum(metrics.whaleNetRatio, 3)}`,
  ].join(' / ')
}

export function buildCause(params: {
  snapshot: FinalizedMetricSnapshot
  causeSignals: any[]
}): string {
  const { snapshot, causeSignals } = params
  const metrics = getFinalizedMetrics(snapshot)

  const stateParts: string[] = []
  const signalParts: string[] = []

  if (metrics.oiDelta > 0) {
    stateParts.push(`OI 증가(${safeNum(metrics.oiDelta)})`)
  } else if (metrics.oiDelta < 0) {
    stateParts.push(`OI 감소(${safeNum(metrics.oiDelta)})`)
  } else {
    stateParts.push(`OI 정체(0)`)
  }

  if (metrics.fundingRate > 0) {
    stateParts.push(`Funding 양수(${safeFunding(metrics.fundingRate)})`)
  } else if (metrics.fundingRate < 0) {
    stateParts.push(`Funding 음수(${safeFunding(metrics.fundingRate)})`)
  } else {
    stateParts.push(`Funding 중립(0.0000%)`)
  }

  if (metrics.volumeRatio > 1) {
    stateParts.push(`거래량 증가(${safeNum(metrics.volumeRatio)}x)`)
  } else if (metrics.volumeRatio < 1) {
    stateParts.push(`거래량 감소(${safeNum(metrics.volumeRatio)}x)`)
  } else {
    stateParts.push(`거래량 정체(1.00x)`)
  }

  if (metrics.whaleNetRatio > 0) {
    stateParts.push(`Whale 매집(${safeNum(metrics.whaleNetRatio, 3)})`)
  } else if (metrics.whaleNetRatio < 0) {
    stateParts.push(`Whale 분할매도(${safeNum(metrics.whaleNetRatio, 3)})`)
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

export function buildRisk(params: {
  snapshot: FinalizedMetricSnapshot
  signal: MarketSignal
}): string {
  const { snapshot, signal } = params
  const metrics = getFinalizedMetrics(snapshot)

  const parts: string[] = []

  parts.push(`Risk ${signal.riskLevel.toUpperCase()}`)

  if (metrics.volumeRatio > 1.1) {
    parts.push(`Volatile`)
  }

  if (metrics.volumeRatio > 1.2 && metrics.oiDelta < 0) {
    parts.push(`Liquidation`)
  }

  return parts.join(' / ')
}

export function buildCompactSummary(
  snapshot: FinalizedMetricSnapshot,
): string {
  const metrics = getFinalizedMetrics(snapshot)

  return [
    `OI ${sign(metrics.oiDelta)}`,
    `Vol ${safeNum(metrics.volumeRatio)}x`,
    `Funding ${safeFunding(metrics.fundingRate)}`,
  ].join(' / ')
}
