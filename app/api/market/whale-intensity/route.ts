import { NextRequest } from 'next/server'
import { getWhaleIntensityHistory } from '@/lib/market/pricePolling'

// 🔥 반드시 추가 (hydrate 보장)
import '@/lib/market/marketRealtimeConsumer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const rawSymbol =
    req.nextUrl.searchParams.get('symbol') ?? 'BTCUSDT'

  const symbol = rawSymbol.toUpperCase()

  const history = getWhaleIntensityHistory(symbol)

  return Response.json({
    symbol,
    history,
    length: history.length,
    ts: Date.now(),
  })
}
