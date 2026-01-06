export function recommendVolatilityAlert(prices: number[]) {
  if (prices.length < 10) return null

  const avg =
    prices.reduce((a, b) => a + b, 0) / prices.length

  const variance =
    prices.reduce((s, p) => s + (p - avg) ** 2, 0) /
    prices.length

  const volatility = Math.sqrt(variance) / avg

  if (volatility < 0.02) return null

  return {
    condition: 'PERCENT',
    percent: Math.round(volatility * 100),
    memo: 'AI 추천: 변동성 급증 구간',
  }
}
