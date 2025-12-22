export function detectOrderbookWhale(
  recentVolume: number,
  avgVolume: number
): boolean {
  if (avgVolume === 0) return false;
  return recentVolume >= avgVolume * 4;
}
