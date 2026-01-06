export type WhaleIntensity = 'LOW' | 'MEDIUM' | 'HIGH'

type Input = {
  oiDelta: number        // 절대값 기준
  volumeDelta: number   // EMA 대비 배수
}

/**
 * Whale Intensity 계산
 * - OI 변화 + 거래량 동시 급증에만 HIGH
 */
export function calcWhaleIntensity({
  oiDelta,
  volumeDelta,
}: Input): WhaleIntensity {
  if (oiDelta >= 8 && volumeDelta >= 2.2) return 'HIGH'
  if (oiDelta >= 3 && volumeDelta >= 1.3) return 'MEDIUM'
  return 'LOW'
}
