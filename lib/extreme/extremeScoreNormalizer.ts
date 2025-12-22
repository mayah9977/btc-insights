export function normalizeExtremeScore(
  raw: number,
  min = 0,
  max = 100
) {
  if (Number.isNaN(raw)) return 0;
  if (!Number.isFinite(raw)) return max;

  return Math.min(
    max,
    Math.max(min, Math.round(raw))
  );
}
