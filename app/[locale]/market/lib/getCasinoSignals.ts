import { calcPersonalAIScore } from "./ai/calcPersonalAIScore";
import {
  calcWhaleIntensity,
  type WhaleIntensity,
} from "./ai/calcWhaleIntensity";

export type CasinoSignal = {
  symbol: string;
  rsi: number;
  funding: number;
  trend: "Bullish" | "Bearish" | "Neutral";
  aiScore: number;
  hasPermission: boolean;
  whaleIntensity: WhaleIntensity;
};

export async function getCasinoSignals(): Promise<CasinoSignal[]> {
  let userPNL = 0;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/account/pnl`,
      { cache: "no-store" }
    );
    if (res.ok) userPNL = await res.json();
  } catch {
    userPNL = 0;
  }

  const baseSignals = [
    {
      symbol: "BTC / USDT",
      rsi: 38,
      funding: -0.002,
      trend: "Bullish" as const,
      baseScore: 82,
      oiDelta: 6_200_000,   // OI 변화량
      volumeDelta: 1.6,    // ⚠️ 임시 거래량 배수 (나중에 실데이터)
    },
  ];

  return baseSignals.map((s) => {
    /** 1️⃣ 개인화 점수 */
    const personalScore = calcPersonalAIScore(s.baseScore, userPNL);

    /** 2️⃣ Whale 강도 계산 (객체 전달) */
    const whaleIntensity = calcWhaleIntensity({
      oiDelta: s.oiDelta,
      volumeDelta: s.volumeDelta,
    });

    /** 3️⃣ Whale 기반 점수 보정 */
    let finalScore = personalScore;

    if (whaleIntensity === "HIGH") finalScore -= 5;
    if (whaleIntensity === "LOW") finalScore += 2;

    finalScore = Math.max(0, Math.min(100, finalScore));

    return {
      symbol: s.symbol,
      rsi: s.rsi,
      funding: s.funding,
      trend: s.trend,
      aiScore: finalScore,
      hasPermission: finalScore >= 85,
      whaleIntensity,
    };
  });
}
