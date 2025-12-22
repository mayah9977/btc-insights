type ActualTrade = {
  at: number
  side: 'LONG' | 'SHORT'
  entry: number
  exit: number
}

const trades: ActualTrade[] = []

export function recordActualTrade(trade: ActualTrade) {
  trades.push(trade)
  if (trades.length > 100) trades.shift()
}

export function verifyTradeWithRisk(
  trade: ActualTrade,
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
) {
  const pnl =
    trade.side === 'LONG'
      ? trade.exit - trade.entry
      : trade.entry - trade.exit

  return {
    pnl,
    risk,
    success:
      risk === 'HIGH'
        ? pnl <= 0 // HIGH Risk → 손실 회피 성공
        : pnl > 0,
  }
}
