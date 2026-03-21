import { MarketSnapshot } from '@/lib/market/engine/marketSnapshot'
import { MarketSignal } from '@/lib/market/signalEngine'

export interface RiskGuidanceResult {
  guidanceSignals: string[]
}

export function interpretRiskGuidance(params: {
  snapshot: MarketSnapshot
  signal: MarketSignal
}): RiskGuidanceResult {

  const { snapshot, signal } = params
  const { oiDelta = 0, volumeRatio = 1, whaleNetRatio = 0 } = snapshot

  const out: string[] = []

  /* =========================================================
   1. Liquidation Zone (핵심)
  ========================================================= */
  if (oiDelta < 0 && volumeRatio > 1.3) {

    if (signal.direction === 'short') {
      out.push(
        `청산 진행 (OI↓ ${oiDelta.toFixed(2)}, Vol ${volumeRatio.toFixed(2)}x) → 하락 추세 지속 가능 → 반등 시 숏 진입 유리`
      )
    } else {
      out.push(
        `청산 진행 구간 → 방향 불안정 → 신규 진입 회피`
      )
    }
  }

  /* =========================================================
   2. Trend Follow (핵심)
  ========================================================= */
  if (Math.abs(whaleNetRatio) > 0.1 && volumeRatio > 1.2) {

    if (whaleNetRatio > 0) {
      out.push(
        `고래 매수 우위(${whaleNetRatio.toFixed(2)}) + 거래량 동반 → 상승 추세 추종 전략`
      )
    } else {
      out.push(
        `고래 매도 우위(${whaleNetRatio.toFixed(2)}) + 거래량 동반 → 하락 추세 추종 전략`
      )
    }
  }

  /* =========================================================
   3. Overheat (리스크 트리거)
  ========================================================= */
  if (signal.tags.includes('LONG_OVERHEAT')) {
    out.push(
      `롱 과열 → 롱 진입 금지 / 익절 구간`
    )
  }

  if (signal.tags.includes('SHORT_OVERHEAT')) {
    out.push(
      `숏 과열 → 숏 진입 금지 / 숏 스퀴즈 주의`
    )
  }

  /* =========================================================
   4. Low Volume (무의미 구간 제거)
  ========================================================= */
  if (volumeRatio < 0.9) {
    out.push(
      `저유동성 (${volumeRatio.toFixed(2)}x) → 신호 신뢰도 낮음 → 관망`
    )
  }

  /* =========================================================
   5. Strong Signal (VIP)
  ========================================================= */
  if (signal.strength > 1.2) {

    if (signal.direction === 'long') {
      out.push(
        `고신뢰 LONG (${signal.strength.toFixed(2)}) → 눌림 매수 전략`
      )
    }

    if (signal.direction === 'short') {
      out.push(
        `고신뢰 SHORT (${signal.strength.toFixed(2)}) → 반등 숏 전략`
      )
    }
  }

  /* =========================================================
   Default
  ========================================================= */
  if (out.length === 0) {
    out.push(
      `신호 약함 (Strength ${signal.strength.toFixed(2)}) → 진입 비추천`
    )
  }

  return { guidanceSignals: out }
}
