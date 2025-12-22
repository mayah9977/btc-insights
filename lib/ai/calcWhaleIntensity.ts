// lib/ai/calcWhaleIntensity.ts

export type WhaleIntensity = "LOW" | "MEDIUM" | "HIGH";

/**
 * OI 변화량 기반 Whale Intensity 계산
 * @param oiDelta % 단위 변화량 (예: 3.2)
 */
export function calcWhaleIntensity(oiDelta: number): WhaleIntensity {
  if (oiDelta >= 8) return "HIGH";
  if (oiDelta >= 3) return "MEDIUM";
  return "LOW";
}
