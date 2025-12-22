'use client'

import {
  calcPredictionReliabilityRank,
} from '@/lib/vip/predictionReliabilityStore'

export function VIP3PredictionAccuracyBadge() {
  const { score, rank } =
    calcPredictionReliabilityRank()

  const color =
    rank === 'A'
      ? 'bg-emerald-500'
      : rank === 'B'
      ? 'bg-blue-500'
      : rank === 'C'
      ? 'bg-yellow-400'
      : 'bg-red-500'

  return (
    <div
      className={`
        inline-flex items-center gap-2
        px-2 py-1 rounded-full text-xs
        ${color} text-black font-semibold
      `}
      title={`Prediction accuracy ${(score * 100).toFixed(
        1
      )}%`}
    >
      Accuracy {rank}
    </div>
  )
}
