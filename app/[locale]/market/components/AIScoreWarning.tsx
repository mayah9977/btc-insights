"use client";

import { useWhaleFrequency } from "../lib/whaleFrequencyStore";

type Props = {
  currentScore: number;
};

export default function AIScoreWarning({ currentScore }: Props) {
  const { getWeight } = useWhaleFrequency();
  const weight = getWeight();

  const showWarning = weight > 1.5 && currentScore >= 80;

  if (!showWarning) return null;

  return (
    <div className="mt-2 text-sm text-red-400 animate-pulse">
      ⚠️ Whale pressure rising — AI Score may decline soon
    </div>
  );
}
