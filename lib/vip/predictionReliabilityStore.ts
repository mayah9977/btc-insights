// lib/vip/predictionReliabilityStore.ts

export type PredictionRecord = {
  predictedProb: number // 0 ~ 1
  occurred: boolean
}

const MAX_HISTORY = 200
const history: PredictionRecord[] = []

export function recordPredictionResult(
  predictedProb: number,
  occurred: boolean
) {
  // 안전 클램프
  const prob = Math.max(0, Math.min(1, predictedProb))

  history.push({ predictedProb: prob, occurred })
  if (history.length > MAX_HISTORY) history.shift()
}

export function calcPredictionReliabilityRank() {
  if (history.length < 10) {
    return {
      score: 0.5,
      rank: 'C' as const,
      samples: history.length,
    }
  }

  let hit = 0

  history.forEach((h) => {
    if (h.predictedProb >= 0.6 && h.occurred) hit++
    else if (h.predictedProb <= 0.4 && !h.occurred) hit++
  })

  const accuracy = hit / history.length

  let rank: 'A' | 'B' | 'C' | 'D' = 'D'
  if (accuracy >= 0.8) rank = 'A'
  else if (accuracy >= 0.65) rank = 'B'
  else if (accuracy >= 0.5) rank = 'C'

  return {
    score: Number(accuracy.toFixed(2)),
    rank,
    samples: history.length,
  }
}
