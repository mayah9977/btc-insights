export function calcOIDelta(prev: number, current: number): number {
  if (!Number.isFinite(prev) || prev === 0) return 0
  if (!Number.isFinite(current)) return 0

  // % 단위 반환
  return ((current - prev) / prev) * 100
}
