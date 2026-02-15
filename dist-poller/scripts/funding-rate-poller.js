"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

const { redis } = require("../lib/redis/index.js");

const SYMBOL = "BTCUSDT";
const INTERVAL_MS = 5000;

let lastFundingRate = null;

console.log("[FUNDING RATE POLLER] started:", SYMBOL);

setInterval(async () => {
  console.log("[FUNDING RATE POLLER] tick", Date.now()); // ✅ 추가된 검증 로그

  try {
    const r = await fetch(
      `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${SYMBOL}`,
    );
    if (!r.ok) return;

    const data = await r.json();
    const fundingRate = Number(data?.lastFundingRate);

    if (!Number.isFinite(fundingRate)) return;
    if (fundingRate === lastFundingRate) return;

    lastFundingRate = fundingRate;

    await redis.publish(
      "realtime:market",
      JSON.stringify({
        type: "FUNDING_RATE_TICK",
        symbol: SYMBOL,
        fundingRate,
        ts: Date.now(),
      }),
    );

    console.log("[FUNDING_RATE]", SYMBOL, fundingRate);
  } catch (e) {
    console.error("[FUNDING RATE POLLER ERROR]", e);
  }
}, INTERVAL_MS);
