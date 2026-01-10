import WebSocket from 'ws';
import { onPriceUpdate } from './pricePolling';

const ws = new WebSocket(
  'wss://stream.binance.com:9443/ws/btcusdt@trade'
);

ws.on('open', () => {
  console.log('[BINANCE WS] connected');
});

ws.on('message', async (raw) => {
  try {
    const data = JSON.parse(raw.toString());
    const price = Number(data.p);

    if (!Number.isFinite(price)) return;

    // ✅ 오직 여기만 호출
    await onPriceUpdate('BTCUSDT', price);
  } catch (e) {
    console.error('[BINANCE WS] message error', e);
  }
});
