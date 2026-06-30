export function adjustHouseEdge(
  aiScore: number,
  recentUserPnL: number
) {
  const edge = recentUserPnL * 0.4;

  return Math.max(
    40,
    Math.min(95, aiScore - edge)
  );
}
