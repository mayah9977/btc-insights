import {
  getActiveAlerts,
  markAlertTriggered,
  updateAlert,
  PriceAlert,
} from './alertStore';

import { sendAlertNotification } from './alertNotifier';

type PriceTick = {
  symbol: string;
  price: number;
};

export async function handlePriceTick(tick: PriceTick) {
  const alerts: PriceAlert[] = await getActiveAlerts(tick.symbol);

  for (const alert of alerts) {
    const hit =
      alert.condition === 'ABOVE'
        ? tick.price >= alert.targetPrice
        : tick.price <= alert.targetPrice;

    if (!hit) continue;

    await sendAlertNotification(alert, tick.price);

    if (alert.repeat === 'ONCE') {
      await markAlertTriggered(alert.id);
    } else {
      await updateAlert(alert.id, {
        lastTriggeredAt: Date.now(),
      });
    }
  }
}
