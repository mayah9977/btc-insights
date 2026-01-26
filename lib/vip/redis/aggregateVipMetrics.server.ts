// lib/vip/redis/aggregateDailyVipMetrics.server.ts

import 'server-only'
import { redis } from '@/lib/redis/index'
import { aggregateVipMetrics } from '@/lib/vip/aggregateVipMetrics'
import { getVipRiskEvents } from '@/lib/vip/redis/getVipRiskEvents'

const TARGET_KEY = 'vip:metrics:daily'

/**
 * 🕒 Daily KPI Snapshot (cron)
 * - SSE / API 와 동일 로직 사용
 */
export async function aggregateDailyVipMetrics() {
  const events = await getVipRiskEvents()

  const metrics7d = aggregateVipMetrics(events, 7)
  const metrics30d = aggregateVipMetrics(events, 30)

  const payload = {
    date: new Date().toISOString().slice(0, 10),
    metrics7d,
    metrics30d,
  }

  await redis.set(TARGET_KEY, JSON.stringify(payload))
}
