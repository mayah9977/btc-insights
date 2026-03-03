export function detectOrderbookWhale(
  recentVolume: number,
  avgVolume: number,
): boolean {
  if (
    !Number.isFinite(recentVolume) ||
    !Number.isFinite(avgVolume) ||
    avgVolume === 0
  ) {
    return false
  }

  // 🔥 기존 4배 → 2.5배로 완화
  return recentVolume >= avgVolume * 2.5
}
