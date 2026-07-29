//app/api/market/whale-intensity/route.ts  

import { NextRequest } from 'next/server'

// ✅ SSOT: whale 히스토리는 Redis Store
import {
  loadWhaleIntensityHistory,
} from '@/lib/market/whaleRedisStore'

// 🔥 반드시 추가 (realtime consumer boot)
import '@/lib/market/marketRealtimeConsumer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const rawSymbol =
    req.nextUrl.searchParams.get('symbol') ?? 'BTCUSDT'

  const symbol = rawSymbol.toUpperCase()

  const history = await loadWhaleIntensityHistory(symbol)

  return Response.json({
    symbol,
    history,
    length: history.length,
    ts: Date.now(),
  })
}
