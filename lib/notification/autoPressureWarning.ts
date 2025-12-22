import { calcPressureIndex } from './calcPressureIndex'
import { recordNotification } from './notificationHistoryStore'

let lastTriggeredAt = 0
const COOLDOWN_MS = 60_000 // 1분

/**
 * Pressure Index 임계치 초과 시
 * 자동 WARNING 알림 생성
 */
export function autoPressureWarning() {
  const now = Date.now()

  // 중복 방지
  if (now - lastTriggeredAt < COOLDOWN_MS) return

  const pressure = calcPressureIndex()

  if (pressure >= 75) {
    recordNotification({
      at: now,
      level: 'WARNING',
      message: `Market pressure is critically high (${pressure}%)`,
      // pressure 기반 경고이므로 신뢰도는 높게 설정
      reliability: Math.min(1, pressure / 100),
    })

    lastTriggeredAt = now
  }
}
