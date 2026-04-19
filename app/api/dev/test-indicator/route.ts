// app/api/dev/test-indicator/route.ts

import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const payload = {
    type: 'INDICATOR_SIGNAL',
    indicator: 'RSI',
    signal: 'RSI_OVERBOUGHT',
    symbol: 'BTCUSDT',
    timeframe: '15m',
    value: 78.42,
    ts: Date.now(),
  }

  console.log('[TEST] publish indicator', payload)

  await redis.publish('realtime:alerts', JSON.stringify(payload))

  return NextResponse.json({
    ok: true,
    payload,
  })
}
