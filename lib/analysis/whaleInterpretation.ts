/**
 * Whale Interpretation Builder (SSOT)
 * - APP / PDF 동일 문장 사용
 * - 계산 ❌
 * - 단순 해석 생성 전용
 */

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

export function buildWhaleInterpretation(intensity: number): string {
  const safe = clamp01(intensity)
  const value = safe.toFixed(2)

  let description: string

  if (safe < 0.30) {
    description = '고래 개입이 제한적인 상태입니다.'
  } else if (safe < 0.55) {
    description = '고래 참여가 점진적으로 증가하는 구간입니다.'
  } else if (safe < 0.70) {
    description = '기관/대형 자금 개입이 가시화되는 구간입니다.'
  } else if (safe < 0.85) {
    description = '강한 체결 압력이 형성되고 있습니다.'
  } else {
    description =
      '극단적 집중 구간입니다. 구조 왜곡 가능성이 존재합니다.'
  }

  return `현재 강도 ${value} — ${description}`
}
