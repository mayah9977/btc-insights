export type WhaleIntensity = "LOW" | "MEDIUM" | "HIGH";

/**
 * OI / 거래량 기반 Whale Intensity 계산
 */
export function calcWhaleIntensity(params: {
  oiChangePercent: number;   // OI 변화율 (%)
  volumeSpikePercent: number; // 거래량 급증률 (%)
}): WhaleIntensity {
  const { oiChangePercent, volumeSpikePercent } = params;

  if (oiChangePercent >= 8 && volumeSpikePercent >= 20) {
    return "HIGH";
  }

  if (oiChangePercent >= 4 || volumeSpikePercent >= 10) {
    return "MEDIUM";
  }

  return "LOW";
}
