"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePriceTick = handlePriceTick;
const alertStore_server_1 = require("../alerts/alertStore.server");
const redis_1 = require("../redis/index.cjs");
/**
 * Poller 전용 Alert Engine
 * - push / firebase / fcm ❌
 * - Redis publish만 수행
 */
async function handlePriceTick(params) {
    const symbol = params.symbol.toUpperCase();
    const price = params.price;
    const alerts = await (0, alertStore_server_1.getActiveAlerts)(symbol);
    if (!alerts.length)
        return;
    for (const alert of alerts) {
        // 비활성 / 이미 트리거된 알림 제외
        if (!alert.enabled || alert.triggered)
            continue;
        // targetPrice 필수
        if (typeof alert.targetPrice !== 'number')
            continue;
        let hit = false;
        if (alert.condition === 'ABOVE') {
            hit = price >= alert.targetPrice;
        }
        else if (alert.condition === 'BELOW') {
            hit = price <= alert.targetPrice;
        }
        if (!hit)
            continue;
        // 🔁 상태 업데이트 (단발)
        await (0, alertStore_server_1.markAlertTriggered)(alert.id);
        // 🔥 Redis realtime event (poller → SSE)
        await redis_1.redis.publish('realtime', JSON.stringify({
            type: 'ALERT_TRIGGERED',
            alertId: alert.id,
            symbol,
            price,
            condition: alert.condition,
            targetPrice: alert.targetPrice,
            ts: Date.now(),
        }));
    }
}
