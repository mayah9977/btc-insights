import type { PriceAlert } from './alertStore.server'
import { sendPush } from '../push/pushSender'

export async function sendAlertNotification(
  alert: PriceAlert,
  hitPrice: number
) {
  console.log('[NOTIFIER] sendAlertNotification', alert.id)

  const symbol = alert.symbol.toUpperCase()

  const title =
    alert.condition === 'ABOVE'
      ? '🚀 가격 상단 돌파'
      : alert.condition === 'BELOW'
      ? '📉 가격 하단 이탈'
      : '🔔 알림'

  const body = `${symbol} 조건 충족\n현재가: ${hitPrice}`

  await sendPush({
    userId: alert.userId,
    title,
    body,
    data: {
      alertId: alert.id,
      symbol: alert.symbol,
      price: String(hitPrice),
      condition: alert.condition,
    },
  })
}
