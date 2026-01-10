"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

const { redis } = require("../lib/redis/index.js");

const SYMBOL = "BTCUSDT";
const INTERVAL_MS = 3000;

let lastPrice = null;

console.log("[POLLER] started:", SYMBOL);

setInterval(async () => {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${SYMBOL}`
    );
    if (!res.ok) return;

    const data = await res.json();
    const price = Number(data?.price);

    if (!Number.isFinite(price)) return;
    if (price === lastPrice) return;

    lastPrice = price;
    console.log("[POLLING]", SYMBOL, price);

    /**
     * ✅ PRICE_TICK만 발행
     * - Alert Engine 호출 ❌
     * - Redis 채널은 realtime:market 로 통일
     */
    await redis.publish(
      "realtime:market",
      JSON.stringify({
        type: "PRICE_TICK",
        symbol: SYMBOL,
        price,
        ts: Date.now(),
      })
    );
  } catch (e) {
    console.error("[POLLER ERROR]", e);
  }
}, INTERVAL_MS);
