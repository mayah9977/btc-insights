/**
 * Risk Level = Pressure + Prediction
 * @param pressure 0~100
 * @param prediction 0~1
 */
export function calcRiskLevel(
  pressure: number,
  prediction: number
) {
  const pressureScore = pressure / 100
  const predictionScore = prediction

  // 가중치 결합
  const combined =
    pressureScore * 0.6 +
    predictionScore * 0.4

  if (combined > 0.7) return 'HIGH'
  if (combined > 0.4) return 'MEDIUM'
  return 'LOW'
}
