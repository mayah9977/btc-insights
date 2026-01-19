import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'

export async function GET() {
  const keys = await redis.keys('vip:risk:event:*')

  let avoidedLoss = 0
  let extremeCount = 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTs = today.getTime()

  for (const key of keys) {
    const e = await redis.hgetall(key)

    if (!e || !e.riskLevel || !e.timestamp) continue
    if (Number(e.timestamp) < todayTs) continue

    if (e.riskLevel === 'EXTREME') {
      extremeCount++
      avoidedLoss += Math.abs(
        Number(e.worstPrice) - Number(e.entryPrice)
      )
    }
  }

  const result = {
    date: new Date().toISOString().slice(0, 10),
    avoidedExtremeCount: extremeCount,
    avoidedLossUSD: Math.round(avoidedLoss),
  }

  // ✅ SET + EXPIRE 분리 (타입 안전)
  await redis.set(
    'vip:metrics:daily',
    JSON.stringify(result)
  )
  await redis.expire(
    'vip:metrics:daily',
    60 * 60 * 24 * 2
  )

  return NextResponse.json({ ok: true, result })
}
