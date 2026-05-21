// app/api/dev/test-indicator-rsi-1h/route.ts

import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getAllUserIds } from '@/lib/push/getAllUserIds'
import { pushIndicatorTriggered } from '@/lib/push/pushOnAlert'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const now = Date.now()
  const eventCandleTs =
    Math.floor(now / 3_600_000) * 3_600_000

  const payload = {
    type: 'INDICATOR_SIGNAL',
    indicator: 'RSI',
    signal: 'RSI_OVERBOUGHT',
    symbol: 'BTCUSDT',
    timeframe: '1h',
    value: 72.35,
    ts: now,
    eventCandleTs,
  } as const

  await redis.publish(
    'realtime:alerts',
    JSON.stringify(payload),
  )

  const userIds = await getAllUserIds()

  await Promise.all(
    userIds.map(userId =>
      pushIndicatorTriggered({
        userId,
        indicator: payload.indicator,
        signal: payload.signal,
        symbol: payload.symbol,
        value: payload.value,
        ts: payload.ts,
        timeframe: payload.timeframe,
        eventCandleTs: payload.eventCandleTs,
      }),
    ),
  )

  return NextResponse.json({
    ok: true,
    payload,
    pushedUsers: userIds.length,
  })
}
