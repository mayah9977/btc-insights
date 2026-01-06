import type { PriceAlert } from './types'

export type AlertStatus =
  | 'DISABLED'
  | 'TRIGGERED'
  | 'COOLDOWN'
  | 'WAITING'

export function getAlertStatus(alert: PriceAlert): AlertStatus {
  if (!alert.enabled) return 'DISABLED'
  if (alert.repeatMode === 'ONCE' && alert.triggered) return 'TRIGGERED'
  return 'WAITING'
}
