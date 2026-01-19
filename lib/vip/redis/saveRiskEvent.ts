import 'server-only' // ✅ Client import 즉시 차단
import { redis } from '@/lib/redis/index'


export interface RiskEvent {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
  entryPrice: number
  worstPrice: number
  position: 'LONG' | 'SHORT'
  timestamp: number
  reason?: string
}

/**
 * HIGH / EXTREME 리스크 이벤트 저장 (Server only)
 *
 * ⚠️ Client에서 import 금지
 * ⚠️ API / Server Service 에서만 호출
 */
export async function saveRiskEvent(event: RiskEvent) {
  const key = `vip:risk:event:${event.timestamp}:${Math.random()
    .toString(36)
    .slice(2, 8)}`

  await redis.hset(key, {
    riskLevel: event.riskLevel,
    entryPrice: String(event.entryPrice),
    worstPrice: String(event.worstPrice),
    position: event.position,
    timestamp: String(event.timestamp),
    reason: event.reason ?? '',
  })

  // ⏱ 60일 보관
  await redis.expire(key, 60 * 60 * 24 * 60)
}
