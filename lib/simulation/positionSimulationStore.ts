type SimulatedTrade = {
  at: number
  action: 'LONG' | 'SHORT'
  entryPrice: number
  exitPrice: number
  pnl: number
}

const trades: SimulatedTrade[] = []

export function simulatePosition(
  action: 'LONG' | 'SHORT',
  entryPrice: number,
  exitPrice: number
) {
  const pnl =
    action === 'LONG'
      ? exitPrice - entryPrice
      : entryPrice - exitPrice

  trades.push({
    at: Date.now(),
    action,
    entryPrice,
    exitPrice,
    pnl,
  })

  if (trades.length > 100) trades.shift()
}

export function getSimulatedTrades() {
  return [...trades]
}
