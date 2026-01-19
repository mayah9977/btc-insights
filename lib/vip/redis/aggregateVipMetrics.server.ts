import { redis } from '@/lib/redis'
import { aggregateVipMetrics } from '@/lib/vip/aggregateVipMetrics'


const SOURCE_KEY = 'vip:risk-events'
const TARGET_KEY = 'vip:metrics:daily'

export async function aggregateDailyVipMetrics() {
  const raw = await redis.lrange(SOURCE_KEY, 0, -1)

  const events = raw.map((v) => JSON.parse(v))

  const metrics7d = aggregateVipMetrics(events, 7)
  const metrics30d = aggregateVipMetrics(events, 30)

  const payload = {
    date: new Date().toISOString().slice(0, 10),
    metrics7d,
    metrics30d,
  }

  await redis.set(TARGET_KEY, JSON.stringify(payload))
}
