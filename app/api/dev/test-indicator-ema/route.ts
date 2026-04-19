// app/api/dev/test-indicator-ema/route.ts

import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function POST() {
  const payload = {
    type: 'INDICATOR_SIGNAL',
    indicator: 'EMA',
    signal: 'GOLDEN_CROSS',
    symbol: 'BTCUSDT',
    timeframe: '15m',
    value: 65000,
    ts: Date.now(),
  }

  await redis.publish('realtime:alerts', JSON.stringify(payload))

  return NextResponse.json({ ok: true })
}
