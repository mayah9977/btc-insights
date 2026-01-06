"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../lib/redis/index");
const SYMBOL = 'BTCUSDT';
const INTERVAL_MS = 5000;
console.log('[OI POLLER] started:', SYMBOL);
setInterval(async () => {
    try {
        const r = await fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${SYMBOL}`);
        if (!r.ok)
            return;
        const data = await r.json();
        const openInterest = Number(data?.openInterest);
        if (!Number.isFinite(openInterest))
            return;
        await index_1.redis.publish('realtime:market', // ✅ PRICE / SSE 와 통일
        JSON.stringify({
            type: 'OI_TICK',
            symbol: SYMBOL,
            openInterest,
            ts: Date.now(),
        }));
        console.log('[OI]', SYMBOL, openInterest);
    }
    catch (e) {
        console.error('[OI POLLER ERROR]', e);
    }
}, INTERVAL_MS);
