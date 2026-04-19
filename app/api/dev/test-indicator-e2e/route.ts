// app/api/dev/test-indicator-e2e/route.ts

import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getAllUserIds } from '@/lib/push/getAllUserIds'
import { pushIndicatorTriggered } from '@/lib/push/pushOnAlert'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const payload = {
    type: 'INDICATOR_SIGNAL',
    indicator: 'MACD',
    signal: 'DEAD_CROSS',
    symbol: 'BTCUSDT',
    timeframe: '15m',
    value: -132.88,
    ts: Date.now(),
  } as const // 🔥 핵심 (반드시 필요)

  console.log('[TEST][E2E] payload', payload)

  // 1. Redis publish (UI 테스트)
  await redis.publish('realtime:alerts', JSON.stringify(payload))

  // 2. 모든 유저 push
  const userIds = await getAllUserIds()

  console.log('[TEST][E2E] users', userIds)

  if (userIds.length) {
    await Promise.all(
      userIds.map(userId =>
        pushIndicatorTriggered({
          userId,
          indicator: payload.indicator, // ✅ 이제 타입 정상
          signal: payload.signal,
          symbol: payload.symbol,
          value: payload.value,
          ts: payload.ts,
        })
      )
    )
  }

  return NextResponse.json({
    ok: true,
    payload,
    users: userIds,
  })
}
