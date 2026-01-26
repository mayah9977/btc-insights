// lib/extreme/processExtremeEvent.ts

import { safeExtremeScore } from './extremeScoreSafe'
import { extremeToNotification } from './extremeToNotification'
import {
  pushExtremeHistory,
  getAverageReliability,
} from './extremeHistoryStore'
import { checkAndLogStableZone } from './stableZoneLogStore'

import { canSendNotification } from '@/lib/notification/notificationCooldown'
import { pushNotification } from '@/lib/notification/notificationQueue'

import { saveRiskEvent } from '@/lib/vip/redis/saveRiskEvent'
import { getVipRiskEvents } from '@/lib/vip/redis/getVipRiskEvents'
import { aggregateVipMetrics } from '@/lib/vip/aggregateVipMetrics'
import { broadcastVipKpi } from '@/lib/vip/vipSSEHub'

import type { ExtremeEvent } from './extremeToNotification'

/**
 * 🔥 Extreme 이벤트 처리 메인 함수 (SSOT)
 */
export async function processExtremeEvent(
  rawEvent: ExtremeEvent
) {
  /**
   * 1️⃣ 점수 안정화
   */
  const score = safeExtremeScore(rawEvent.score)

  /**
   * 2️⃣ Notification 후보 생성
   */
  const notif = extremeToNotification({
    ...rawEvent,
    score,
  })

  /**
   * ❌ Notification 생성 실패 → EXTREME 확정 아님
   */
  if (!notif) {
    return
  }

  /**
   * 3️⃣ Extreme 신뢰도 히스토리 기록
   */
  if (notif.reliability !== undefined) {
    pushExtremeHistory(notif.reliability)
  }

  /**
   * 4️⃣ Stable Zone 자동 진입 로그
   */
  checkAndLogStableZone(getAverageReliability())

  /**
   * 5️⃣ 🔥 EXTREME RiskEvent 저장 (VIP 핵심)
   */
  await saveRiskEvent({
    riskLevel: 'EXTREME',
    entryPrice: rawEvent.entryPrice,
    worstPrice: rawEvent.worstPrice,
    position: rawEvent.position ?? 'LONG',
    timestamp: Date.now(),
    reason: 'Extreme volatility detected',
  })

  /**
   * 5️⃣-1️⃣ ✅ KPI 즉시 재계산 + SSE Broadcast (핵심 추가)
   */
  try {
    const events = await getVipRiskEvents()

    broadcastVipKpi({
      metrics7d: aggregateVipMetrics(events, 7),
      metrics30d: aggregateVipMetrics(events, 30),
    })
  } catch (e) {
    console.warn('[VIP KPI SSE] failed', e)
  }

  /**
   * 6️⃣ Notification 발행
   */
  if (canSendNotification(notif)) {
    pushNotification(notif)
  }
}
