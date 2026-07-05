//lib/vip/redis/getLatesRiskEvent.ts  

import 'server-only' // ✅ Client import 즉시 차단
import { redis } from '@/lib/redis/index'

export type LatestRiskEvent = {
  riskLevel: 'HIGH' | 'EXTREME'
  reason: string | null
  timestamp: number
}

/**
 * 🔎 최근 HIGH / EXTREME RiskEvent 1건 조회 (SSOT)
 *
 * 사용처:
 * - VIPNoEntryReasonBanner
 * - 오늘 진입 금지 사유 (단일 결론)
 *
 * 정책:
 * - HIGH / EXTREME만 대상
 * - timestamp 기준 최신 1건
 * - reason 없으면 null
 */
export async function getLatestRiskEvent(): Promise<LatestRiskEvent | null> {
  const keys = await redis.keys('vip:risk:event:*')
  if (keys.length === 0) return null

  let latest: LatestRiskEvent | null = null

  for (const key of keys) {
    const data = await redis.hgetall(key)
    if (!data?.riskLevel || !data.timestamp) continue

    // HIGH / EXTREME만 허용
    if (data.riskLevel !== 'HIGH' && data.riskLevel !== 'EXTREME') {
      continue
    }

    const timestamp = Number(data.timestamp)
    if (!Number.isFinite(timestamp)) continue

    if (!latest || timestamp > latest.timestamp) {
      latest = {
        riskLevel: data.riskLevel,
        reason:
          typeof data.reason === 'string' && data.reason.trim().length > 0
            ? data.reason
            : null,
        timestamp,
      }
    }
  }

  return latest
}
