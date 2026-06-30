export function calcPersonalAIScore(
  baseScore: number,
  userPNL: number
): number {
  if (!Number.isFinite(baseScore)) return 0;

  const pnlAdjustment =
    Number.isFinite(userPNL)
      ? Math.max(-10, Math.min(10, userPNL / 10))
      : 0;

  const score = baseScore + pnlAdjustment;
  return Math.max(0, Math.min(100, Math.round(score)));
}
