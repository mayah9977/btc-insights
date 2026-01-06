"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAlerts = listAlerts;
exports.getActiveAlerts = getActiveAlerts;
exports.createAlert = createAlert;
exports.updateAlert = updateAlert;
exports.deleteAlert = deleteAlert;
exports.markAlertTriggered = markAlertTriggered;
const redis_1 = require("../redis");
const ALERT_KEY = 'alerts';
/* =========================
 * 조회
 * ========================= */
async function listAlerts(userId) {
    const raw = await redis_1.redis.hgetall(ALERT_KEY);
    return Object.values(raw)
        .map(v => JSON.parse(v))
        .filter(a => a.userId === userId);
}
/* =========================
 * 엔진용 조회
 * ========================= */
async function getActiveAlerts(symbol) {
    const raw = await redis_1.redis.hgetall(ALERT_KEY);
    return Object.values(raw)
        .map(v => JSON.parse(v))
        .filter(a => {
        if (!a.enabled)
            return false;
        if (a.symbol !== symbol.toUpperCase())
            return false;
        if (a.repeatMode === 'ONCE' && a.triggered)
            return false;
        return true;
    });
}
/* =========================
 * 생성
 * ========================= */
async function createAlert(input) {
    const now = Date.now();
    const alert = {
        id: crypto.randomUUID(),
        userId: input.userId,
        exchange: input.exchange,
        symbol: input.symbol.toUpperCase(),
        condition: input.condition,
        targetPrice: input.targetPrice,
        basePrice: input.basePrice,
        percent: input.percent,
        trailingPercent: input.trailingPercent,
        enabled: true,
        repeatMode: input.repeatMode ?? 'ONCE',
        cooldownMs: input.cooldownMs ?? 0,
        triggered: false,
        createdAt: now,
        memo: input.memo,
    };
    await redis_1.redis.hset(ALERT_KEY, alert.id, JSON.stringify(alert));
    return alert;
}
/* =========================
 * 수정
 * ========================= */
async function updateAlert(id, patch) {
    const raw = await redis_1.redis.hget(ALERT_KEY, id);
    if (!raw)
        return null;
    const next = {
        ...JSON.parse(raw),
        ...patch,
    };
    await redis_1.redis.hset(ALERT_KEY, id, JSON.stringify(next));
    return next;
}
/* =========================
 * 삭제
 * ========================= */
async function deleteAlert(id) {
    await redis_1.redis.hdel(ALERT_KEY, id);
}
/* =========================
 * 트리거 처리
 * ========================= */
async function markAlertTriggered(id) {
    const raw = await redis_1.redis.hget(ALERT_KEY, id);
    if (!raw)
        return;
    const alert = JSON.parse(raw);
    const now = Date.now();
    const next = {
        ...alert,
        lastTriggeredAt: now,
        triggered: alert.repeatMode === 'ONCE'
            ? true
            : alert.triggered,
    };
    await redis_1.redis.hset(ALERT_KEY, id, JSON.stringify(next));
}
