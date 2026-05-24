//woker/src/alerts/alertNotifier.ts

import type { PriceAlert } from './alertStore';

/**
 * 🔔 알림 전송 허브 (Worker)
 * - 현재: 콘솔 로그 (Stub)
 * - 추후: Telegram / FCM / Webhook 연결
 */
export async function sendAlertNotification(
  alert: PriceAlert,
  currentPrice: number
) {
  // 🔥 여기서 실제 Push / Telegram 연동
  console.log('🔔 ALERT TRIGGERED');
  console.log({
    userId: alert.userId,
    symbol: alert.symbol,
    condition: alert.condition,
    targetPrice: alert.targetPrice,
    currentPrice,
    repeat: alert.repeat,
  });
}
