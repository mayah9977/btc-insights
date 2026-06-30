// app/[locale]/casino/lib/calcAIScore.ts

type AIScoreInput = {
  rsi: number;
  funding: number;
  openInterestChange: number; // % 기준
};

export function calcAIScore({
  rsi,
  funding,
  openInterestChange,
}: AIScoreInput): number {
  // 1️⃣ RSI 점수
  let rsiScore = 50;
  if (rsi <= 30) rsiScore = 100;
  else if (rsi >= 70) rsiScore = 0;
  else rsiScore = 100 - ((rsi - 30) / 40) * 100;

  // 2️⃣ Funding 점수 (음수일수록 좋음)
  const fundingScore = Math.max(
    0,
    Math.min(100, 50 - funding * 5000)
  );

  // 3️⃣ OI 점수
  const oiScore = Math.max(
    0,
    Math.min(100, 50 + openInterestChange * 10)
  );

  // 최종 가중 합산
  const finalScore =
    rsiScore * 0.35 +
    fundingScore * 0.3 +
    oiScore * 0.35;

  return Math.round(finalScore);
}
