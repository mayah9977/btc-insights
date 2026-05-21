// app/api/dev/test-institutional-flow-alert/route.ts

import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const now = Date.now()
  const confirmedCandleTs =
    Math.floor(now / 1_800_000) * 1_800_000

  const payload = {
    type: 'INSTITUTIONAL_PATTERN_SIGNAL',
    pattern: 'LONG_PRESSURE_BUILDING',
    intensity: 'BUILDING',
    risk: 'MEDIUM',
    summary:
      '롱 방향 기관 압력 누적 가능성이 감지됩니다.',
    confirmedCandleTs,
    ts: now,
  } as const

  await redis.publish(
    'realtime:alerts',
    JSON.stringify(payload),
  )

  return NextResponse.json({
    ok: true,
    devOnly: true,
    route:
      '/api/dev/test-institutional-flow-alert',
    payload,
  })
}
