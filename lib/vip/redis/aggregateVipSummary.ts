import { redis } from '@/lib/redis'

type SummaryResult = {
  period: '7d' | '30d'
  avoidedLossUSD: number
  avoidedExtremeCount: number
}

export async function aggregateVipSummary(
  days: 7 | 30
): Promise<SummaryResult> {
  const keys = await redis.keys('vip:risk:event:*')
  const now = Date.now()
  const from = now - days * 24 * 60 * 60 * 1000

  let avoidedLossUSD = 0
  let avoidedExtremeCount = 0

  for (const key of keys) {
    const e = await redis.hgetall(key)
    const ts = Number(e.timestamp)

    if (ts < from) continue

    if (e.riskLevel === 'EXTREME') {
      avoidedExtremeCount++
      avoidedLossUSD += Math.abs(
        Number(e.worstPrice) - Number(e.entryPrice)
      )
    }
  }

  return {
    period: days === 7 ? '7d' : '30d',
    avoidedLossUSD: Math.round(avoidedLossUSD),
    avoidedExtremeCount,
  }
}
