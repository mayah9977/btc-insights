export type WhaleIntensity = "LOW" | "MEDIUM" | "HIGH";

export function calcWhaleIntensity(params: {
  oiChangePct: number;      // OI 변화율 (%)
  volumeMultiplier: number; // 평균 대비 거래량 배수
}): WhaleIntensity {
  const { oiChangePct, volumeMultiplier } = params;

  if (oiChangePct >= 8 && volumeMultiplier >= 2.5) {
    return "HIGH";
  }

  if (oiChangePct >= 4 && volumeMultiplier >= 1.5) {
    return "MEDIUM";
  }

  return "LOW";
}
