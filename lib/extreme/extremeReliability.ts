export function calcExtremeReliability(score: number) {
  if (score >= 90) return 0.95;
  if (score >= 80) return 0.85;
  if (score >= 70) return 0.7;
  if (score >= 60) return 0.55;
  return 0.4;
}
