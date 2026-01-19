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
import type { ExtremeEvent } from './extremeToNotification'

/**
 * 🔥 Extreme 이벤트 처리 메인 함수 (SSOT)
 *
 * 이 함수에 들어왔다는 것 자체가
 * 시스템이 EXTREME 후보로 판단했다는 의미
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
   *
   * 이 함수는 EXTREME 전용 파이프라인이므로
   * level 비교 불필요
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
   * 6️⃣ Notification 발행
   */
  if (canSendNotification(notif)) {
    pushNotification(notif)
  }
}
