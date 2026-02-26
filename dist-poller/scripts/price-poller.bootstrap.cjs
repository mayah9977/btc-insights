"use strict";

/**
 * ⚠ DISABLED BOOTSTRAP
 *
 * Poller architecture has been deprecated.
 * Real-time data is now handled via Binance WebSocket streams.
 *
 * This bootstrap does nothing intentionally.
 */

console.warn(
  "[PRICE POLLER BOOTSTRAP] DISABLED - WebSocket architecture active",
);

// 즉시 종료 (안전)
process.exit(0);
