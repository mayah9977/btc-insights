export function buildMetaKey(snapshot: any): string {
  // 🔥 복합 변동성 기준 (실전용)
  const volatility =
    Math.abs(snapshot?.oiDelta ?? 0) +
    Math.abs(snapshot?.whaleNetRatio ?? 0);

  // 🔥 Adaptive Threshold
  const factor = volatility > 0.5 ? 5 : 10;

  return [
    Math.round((snapshot?.oiDelta ?? 0) * factor),
    Math.round((snapshot?.volumeRatio ?? 0) * 10),
    Math.round((snapshot?.fundingRate ?? 0) * 10000),
    Math.round((snapshot?.whaleNetRatio ?? 0) * factor),
  ].join('|');
}
