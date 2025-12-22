import { getNotificationHistory } from './notificationHistoryStore'
import { getAverageReliability } from '@/lib/extreme/extremeHistoryStore'

/**
 * Pressure Index: 0 ~ 100
 *
 * 구성 요소:
 * 1) Notification Level Intensity (70%)
 * 2) Notification Volume (30%)
 * 3) Extreme Reliability 보정 (최종 가중)
 */
export function calcPressureIndex(): number {
  const items = getNotificationHistory()
  if (items.length === 0) return 0

  let info = 0
  let warning = 0
  let critical = 0

  for (const n of items) {
    if (n.level === 'INFO') info++
    if (n.level === 'WARNING') warning++
    if (n.level === 'CRITICAL') critical++
  }

  const total = items.length

  /* ===============================
     1️⃣ Notification Intensity (0~1)
     =============================== */
  const intensity =
    (info * 0.2 +
      warning * 0.6 +
      critical * 1.0) /
    total

  /* ===============================
     2️⃣ Notification Volume (0~1)
     =============================== */
  const volume = Math.min(1, total / 30)

  /* ===============================
     3️⃣ Reliability 보정 (0~1)
     - 신뢰도 낮을수록 압력 ↑
     =============================== */
  const reliability = getAverageReliability()
  const reliabilityFactor = 1 - reliability

  /* ===============================
     최종 Pressure 결합
     =============================== */
  const raw =
    intensity * 0.5 +
    volume * 0.2 +
    reliabilityFactor * 0.3

  return Math.round(
    Math.min(1, raw) * 100
  )
}

export function pressureLabel(p: number) {
  if (p > 75) return 'HIGH'
  if (p > 40) return 'MEDIUM'
  return 'LOW'
}
