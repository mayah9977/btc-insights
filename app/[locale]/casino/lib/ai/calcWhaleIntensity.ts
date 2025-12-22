export type WhaleIntensity = "LOW" | "MEDIUM" | "HIGH";

/**
 * OI 변화량 + 거래량 기반 Whale 강도 계산
 */
export function calcWhaleIntensity(params: {
  oiDelta: number;        // OI 변화량 (% or absolute)
  volumeDelta: number;   // 거래량 변화량
}): WhaleIntensity {
  const { oiDelta, volumeDelta } = params;

  // 🔥 강력한 고래
  if (oiDelta > 8 && volumeDelta > 1.5) {
    return "HIGH";
  }

  // ⚠️ 중간 고래
  if (oiDelta > 4 && volumeDelta > 1.2) {
    return "MEDIUM";
  }

  // 💤 약한 고래
  return "LOW";
}
