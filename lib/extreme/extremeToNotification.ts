import type {
  NotificationLevel,
  NotificationItem,
} from '@/lib/notification/notificationTypes'
import { calcExtremeReliability } from './extremeReliability'

/**
 * 🔥 ExtremeEvent (확장 완료)
 * - 기존 알림 로직 유지
 * - VIP RiskEvent 저장을 위한 필드 추가
 */
export type ExtremeEvent = {
  type: string
  score: number

  // ✅ VIP RiskEvent 저장용 (핵심)
  entryPrice: number
  worstPrice: number
  position?: 'LONG' | 'SHORT'
}

export function extremeToNotification(
  e: ExtremeEvent
): NotificationItem | null {
  if (e.score < 70) return null

  const level: NotificationLevel =
    e.score >= 90 ? 'CRITICAL' : 'WARNING'

  return {
    message: `[${e.type}] 신호 감지`,
    level,
    at: Date.now(),
    reliability: calcExtremeReliability(e.score),
  } as NotificationItem & { reliability: number }
}
