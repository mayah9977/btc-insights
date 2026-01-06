import { openPaperPosition } from '@/lib/paper/paperTradeStore'
import { recommendPositionStrategy } from './positionStrategy'

export async function autoExecutePosition(params: {
  userId: string
  symbol: string
  price: number
  hitRate: number
  avgPnL: number
  volatility: number
}) {
  const strategy = recommendPositionStrategy(params)

  if (strategy === 'WAIT') return null

  const side =
    strategy === 'LONG' || strategy === 'STRONG_LONG'
      ? 'LONG'
      : 'SHORT'

  return await openPaperPosition({
    userId: params.userId,
    symbol: params.symbol,
    side,
    entryPrice: params.price,
  })
}
