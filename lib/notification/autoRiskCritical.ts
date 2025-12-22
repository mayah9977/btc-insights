import { calcPressureIndex } from './calcPressureIndex'
import { recordNotification } from './notificationHistoryStore'
import { calcRiskLevel } from '@/lib/risk/calcRiskLevel'
import { getExtremeHistory } from '@/lib/extreme/extremeHistoryStore'
import { sendMobileNotification } from '@/lib/notification/sendMobileNotification'

let lastTriggeredAt = 0
const COOLDOWN_MS = 90_000 // 1.5분

function calcPrediction(): number {
  const history = getExtremeHistory()
  if (history.length < 3) return 0.2

  const recent = history.slice(-5)
  const avg =
    recent.reduce((a, b) => a + b.reliability, 0) /
    recent.length

  return Math.min(1, Math.max(0, 1 - avg))
}

export function autoRiskCritical() {
  const now = Date.now()
  if (now - lastTriggeredAt < COOLDOWN_MS) return

  const pressure = calcPressureIndex()
  const prediction = calcPrediction()
  const risk = calcRiskLevel(pressure, prediction)

  if (risk === 'HIGH') {
    recordNotification({
      at: now,
      level: 'CRITICAL',
      message: `HIGH RISK detected (Pressure ${pressure}%)`,
      reliability: prediction,
    })

    sendMobileNotification({
      title: '🚨 HIGH RISK ALERT',
      body: `Market pressure ${pressure}% · Extreme probability ${Math.round(
        prediction * 100
      )}%`,
    })

    lastTriggeredAt = now
  }
}
