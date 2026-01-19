import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'

export async function GET() {
  const keys = await redis.keys('vip:risk:event:*')

  const events = await Promise.all(
    keys.map(async (key) => {
      const e = await redis.hgetall(key)
      return {
        riskLevel: e.riskLevel,
        entryPrice: Number(e.entryPrice),
        worstPrice: Number(e.worstPrice),
        position: e.position,
        timestamp: Number(e.timestamp),
        reason: e.reason,
      }
    })
  )

  // 최신순
  events.sort((a, b) => b.timestamp - a.timestamp)

  return NextResponse.json(events)
}
