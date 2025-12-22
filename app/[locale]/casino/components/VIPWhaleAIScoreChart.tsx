"use client";

import { useMemo } from "react";
import { useWhaleFrequency } from "../lib/whaleFrequencyStore";

type Props = {
  aiScoreHistory: number[]; // 최근 AI Score 스냅샷 (최대 60)
};

type WhaleBucket = {
  high: number;
  medium: number;
  low: number;
};

export default function VIPWhaleAIScoreChart({
  aiScoreHistory,
}: Props) {
  const { events } = useWhaleFrequency();

  /**
   * 1️⃣ 최근 60개 타임슬롯에 대해
   * Whale 빈도 버킷 계산
   */
  const whaleBuckets: WhaleBucket[] = useMemo(() => {
    const buckets: WhaleBucket[] = Array.from({ length: 60 }, () => ({
      high: 0,
      medium: 0,
      low: 0,
    }));

    const now = Date.now();
    const slotMs = 10_000; // 10초 단위 슬롯
    const maxSlots = 60;

    for (const e of events) {
      const diff = now - e.ts;
      if (diff < 0) continue;

      const idx = Math.floor(diff / slotMs);
      if (idx >= maxSlots) continue;

      if (e.intensity === "HIGH") buckets[idx].high++;
      else if (e.intensity === "MEDIUM") buckets[idx].medium++;
      else buckets[idx].low++;
    }

    return buckets;
  }, [events]);

  /**
   * 2️⃣ Whale Frequency → AI Score 보정
   * HIGH 많을수록 Score 압축 (과열)
   */
  const adjustedScores = useMemo(() => {
    return aiScoreHistory.slice(0, 60).map((score, i) => {
      const b = whaleBuckets[i];
      if (!b) return score;

      const whalePressure =
        b.high * 0.25 + b.medium * 0.12 + b.low * 0.05;

      // 과열 시 점수 눌림
      const adjusted = Math.max(
        0,
        Math.min(100, score - whalePressure * 10)
      );

      return adjusted;
    });
  }, [aiScoreHistory, whaleBuckets]);

  return (
    <div className="bg-neutral-900 p-4 rounded-xl text-white">
      <h2 className="font-bold mb-3">
        📊 Whale × AI Score Correlation (VIP)
      </h2>

      {/* AI Score Graph (Whale-adjusted) */}
      <div className="flex gap-1 mb-2 items-end">
        {adjustedScores.map((score, i) => {
          const bucket = whaleBuckets[i];
          const overheat = bucket?.high >= 2;

          return (
            <div
              key={i}
              title={`AI: ${score.toFixed(
                1
              )} | HIGH:${bucket?.high ?? 0}`}
              className={[
                "w-2 rounded transition-all",
                overheat
                  ? "bg-red-500 animate-pulse"
                  : score >= 80
                  ? "bg-yellow-400"
                  : score >= 60
                  ? "bg-green-400"
                  : "bg-blue-400",
              ].join(" ")}
              style={{
                height: `${Math.max(8, score * 0.4)}px`,
              }}
            />
          );
        })}
      </div>

      {/* Whale Frequency Heatmap */}
      <div className="flex gap-1 items-end">
        {whaleBuckets.map((b, i) => (
          <div
            key={i}
            title={`HIGH:${b.high} MED:${b.medium} LOW:${b.low}`}
            className={[
              "w-2 rounded",
              b.high > 0
                ? "bg-red-600"
                : b.medium > 0
                ? "bg-yellow-400"
                : b.low > 0
                ? "bg-green-500"
                : "bg-neutral-700",
            ].join(" ")}
            style={{
              height: `${
                6 + b.high * 6 + b.medium * 3 + b.low * 2
              }px`,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 text-xs text-neutral-400 space-y-1">
        <p>■ 위 그래프: Whale Frequency 반영 AI Score</p>
        <p>■ 빨간 막대: HIGH 고래 과열 구간</p>
        <p>■ 점수 하락 = 진입 실패 확률 상승</p>
      </div>
    </div>
  );
}
