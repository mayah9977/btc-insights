type PressureState = {
  lastPrice?: number
}

const stateMap: Record<string, PressureState> = {}

export function calculateMarketPressure(symbol: string, price: number) {
  const prev = stateMap[symbol]

  let velocity = 0
  if (prev?.lastPrice) {
    velocity = (price - prev.lastPrice) / prev.lastPrice
  }

  // -1 ~ +1 clamp
  const score = Math.max(-1, Math.min(1, velocity * 120))

  stateMap[symbol] = {
    lastPrice: price,
  }

  return {
    score,
    direction:
      score > 0 ? 'BULL' : score < 0 ? 'BEAR' : 'NEUTRAL',
  }
}
