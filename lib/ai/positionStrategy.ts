type StrategyInput = {
  hitRate: number
  avgPnL: number
  volatility: number
  rsi?: number
}

export type PositionStrategy =
  | 'STRONG_LONG'
  | 'LONG'
  | 'WAIT'
  | 'SHORT'
  | 'STRONG_SHORT'

export function recommendPositionStrategy(
  input: StrategyInput
): PositionStrategy {
  const { hitRate, avgPnL, volatility, rsi } = input

  // 고신뢰 + 수익
  if (hitRate > 0.65 && avgPnL > 3) {
    if (rsi !== undefined && rsi > 70) return 'STRONG_SHORT'
    return 'STRONG_LONG'
  }

  // 중간 신뢰
  if (hitRate > 0.55 && avgPnL > 1) {
    return 'LONG'
  }

  // 불안정 / 고변동
  if (volatility > 0.05) {
    return 'WAIT'
  }

  // 저성과
  return 'SHORT'
}
