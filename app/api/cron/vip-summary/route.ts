import { redis } from '@/lib/redis'
import { aggregateVipSummary } from '@/lib/vip/redis/aggregateVipSummary'
import { NextResponse } from 'next/server'

export async function GET() {
  const weekly = await aggregateVipSummary(7)
  const monthly = await aggregateVipSummary(30)

  await redis.set(
    'vip:summary:7d',
    JSON.stringify(weekly)
  )
  await redis.set(
    'vip:summary:30d',
    JSON.stringify(monthly)
  )

  return NextResponse.json({
    ok: true,
    weekly,
    monthly,
  })
}
