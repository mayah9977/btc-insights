type PredictionRecord = {
  predictedProb: number // 0~1
  occurred: boolean
}

const history: PredictionRecord[] = []

export function recordPredictionResult(
  predictedProb: number,
  occurred: boolean
) {
  history.push({ predictedProb, occurred })
  if (history.length > 200) history.shift()
}

export function calcPredictionReliabilityRank() {
  if (history.length < 10) {
    return { score: 0.5, rank: 'C' }
  }

  let score = 0

  history.forEach((h) => {
    if (h.predictedProb > 0.6 && h.occurred) score++
    if (h.predictedProb < 0.4 && !h.occurred) score++
  })

  const accuracy = score / history.length

  let rank: 'A' | 'B' | 'C' | 'D' = 'D'
  if (accuracy > 0.8) rank = 'A'
  else if (accuracy > 0.65) rank = 'B'
  else if (accuracy > 0.5) rank = 'C'

  return { score: accuracy, rank }
}
