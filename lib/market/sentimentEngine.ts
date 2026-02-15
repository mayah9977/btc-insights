// ❌ 절대 'use server' 넣지 마세요
// 이 파일은 순수 계산 유틸입니다.

import type { RealtimeRiskSnapshot } from './buildRiskInputFromRealtime'

/**
 * Fear / Greed Self Engine
 * Return: 0 ~ 100
 */
function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

export function computeSentiment(
  snapshot: RealtimeRiskSnapshot,
): number {
  const {
    whaleIntensity,
    volatility,
    fundingRate,
    marketPulse,
  } = snapshot

  /* =========================
   * 1️⃣ Funding normalization
   * 기준 범위: -0.05 ~ +0.05
   * ========================= */
  const fundingNorm = clamp01(
    (fundingRate + 0.05) / 0.1,
  )

  /* =========================
   * 2️⃣ Volatility normalization
   * 이미 0~1 가정
   * ========================= */
  const volNorm = clamp01(volatility)

  /* =========================
   * 3️⃣ Whale intensity
   * 이미 0~1
   * ========================= */
  const whaleNorm = clamp01(whaleIntensity)

  /* =========================
   * 4️⃣ Market pulse factor
   * ========================= */
  const pulseScore =
    marketPulse === 'ACCELERATING'
      ? 1
      : 0.4

  /* =========================
   * Weighting
   * Whale 40%
   * Volatility 20%
   * Funding 20%
   * Pulse 20%
   * ========================= */
  const composite =
    0.4 * whaleNorm +
    0.2 * volNorm +
    0.2 * fundingNorm +
    0.2 * pulseScore

  return Math.round(clamp01(composite) * 100)
}
