// lib/vip/redis/getVipRiskEvents.ts

import 'server-only'
import { redis } from '@/lib/redis/index'
import type { RiskEvent } from '@/lib/vip/calcAvoidedLoss'

/**
 * 🔑 VIP RiskEvent 조회 (SSOT)
 *
 * - saveRiskEvent로 저장된 모든 EXTREME / HIGH 이벤트 조회
 * - cron / SSE / API 공통 사용
 */
export async function getVipRiskEvents(): Promise<
  (RiskEvent & { timestamp: number })[]
> {
  /**
   * Redis Key Pattern
   * vip:risk:event:{timestamp}:{rand}
   */
  const keys = await redis.keys('vip:risk:event:*')

  if (!keys || keys.length === 0) return []

  const raws = await Promise.all(
    keys.map(async (key) => {
      const data = await redis.hgetall(key)
      if (!data || !data.timestamp) return null

      return {
        riskLevel: data.riskLevel as RiskEvent['riskLevel'],
        entryPrice: Number(data.entryPrice),
        worstPrice: Number(data.worstPrice),
        position: data.position as RiskEvent['position'],
        timestamp: Number(data.timestamp),
      }
    })
  )

  return raws.filter(
    (e): e is RiskEvent & { timestamp: number } => Boolean(e)
  )
}
