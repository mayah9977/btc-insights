type Inputs = {
  rsi: number;
  funding: number;
  oiDelta: number;
  userWinRate: number;
};

export function calcAIScorePersonal({
  rsi,
  funding,
  oiDelta,
  userWinRate,
}: Inputs) {
  const base =
    (100 - Math.abs(rsi - 50)) * 0.35 +
    (1 - Math.abs(funding)) * 30 +
    Math.min(oiDelta / 5, 1) * 25;

  // 👑 개인 계정 보정
  const personalBoost = userWinRate >= 0.6 ? 1.15 : 1.0;

  return Math.min(Math.round(base * personalBoost), 100);
}
