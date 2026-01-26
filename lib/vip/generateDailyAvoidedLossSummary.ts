import 'server-only'
import { redis } from '@/lib/redis/index'

export async function generateDailyAvoidedLossSummary(): Promise<string | null> {
  const keys = await redis.keys('vip:risk:event:*')
  if (keys.length === 0) return null

  const today = new Date().toDateString()
  let totalLoss = 0
  let extremeCount = 0

  for (const key of keys) {
    const e = await redis.hgetall(key)
    if (!e?.timestamp) continue

    const date = new Date(Number(e.timestamp)).toDateString()
    if (date !== today) continue

    const loss = Math.abs(
      Number(e.worstPrice) - Number(e.entryPrice)
    )

    totalLoss += loss
    if (e.riskLevel === 'EXTREME') extremeCount++
  }

  if (totalLoss === 0) return null

  return `오늘 VIP가 피한 손실: +$${totalLoss.toLocaleString()} (EXTREME ${extremeCount}회)`
}
