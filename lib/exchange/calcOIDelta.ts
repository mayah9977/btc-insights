export function calcOIDelta(prev: number, current: number): number {
  if (prev === 0) return 0;
  return ((current - prev) / prev) * 100;
}
