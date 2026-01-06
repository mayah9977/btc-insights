// @ts-nocheck
import WebSocket from 'ws';
import { getActiveAlerts, markAlertTriggered } from '../alerts/alertStore';
import { sendAlertNotification } from '../alerts/alertNotifier';

const ws = new WebSocket(
  'wss://stream.binance.com:9443/ws/btcusdt@trade'
);

ws.on('message', async (raw) => {
  const data = JSON.parse(raw.toString());
  const price = Number(data.p);

  const alerts = await getActiveAlerts('btcusdt');

  for (const alert of alerts) {
    const hit =
      alert.condition === 'ABOVE'
        ? price >= alert.targetPrice
        : price <= alert.targetPrice;

    if (hit) {
      await markAlertTriggered(alert.id);
      await sendAlertNotification(alert, price);
    }
  }
});

ws.on('open', () => {
  console.log('[BINANCE WS] connected');
});
