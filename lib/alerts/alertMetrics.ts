export function calculateSharpe(returns: number[]) {
  if (returns.length < 2) return 0

  const avg =
    returns.reduce((a, b) => a + b, 0) / returns.length

  const variance =
    returns.reduce((s, r) => s + (r - avg) ** 2, 0) /
    returns.length

  const std = Math.sqrt(variance)
  return std === 0 ? 0 : avg / std
}

export function calculateMaxDrawdown(returns: number[]) {
  let peak = 0
  let maxDD = 0
  let cumulative = 0

  for (const r of returns) {
    cumulative += r
    peak = Math.max(peak, cumulative)
    maxDD = Math.min(maxDD, cumulative - peak)
  }

  return maxDD
}
