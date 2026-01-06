"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.createRedisSubscriber = createRedisSubscriber;
const ioredis_1 = __importDefault(require("ioredis"));
/* =========================
 * Environment Validation
 * ========================= */
if (!process.env.REDIS_URL) {
    throw new Error('[Redis] REDIS_URL is not defined');
}
/* =========================
 * Redis Client (Base)
 * ========================= */
exports.redis = new ioredis_1.default(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // ✅ Pub/Sub, SSE에서 필수
    enableReadyCheck: true,
    reconnectOnError(err) {
        const message = err?.message || '';
        if (message.includes('READONLY') ||
            message.includes('ECONNRESET') ||
            message.includes('ETIMEDOUT')) {
            return true;
        }
        return false;
    },
});
/* =========================
 * Logging
 * ========================= */
exports.redis.on('connect', () => {
    console.log('[Redis] connected');
});
exports.redis.on('ready', () => {
    console.log('[Redis] ready');
});
exports.redis.on('reconnecting', (delay) => {
    console.warn('[Redis] reconnecting...', delay);
});
exports.redis.on('error', err => {
    console.error('[Redis] error', err);
});
exports.redis.on('close', () => {
    console.warn('[Redis] connection closed');
});
/* =========================
 * Helpers
 * ========================= */
/**
 * Redis subscriber 전용 client 생성
 * - Pub/Sub은 반드시 duplicate 사용
 */
function createRedisSubscriber() {
    const sub = exports.redis.duplicate();
    sub.on('connect', () => {
        console.log('[Redis:sub] connected');
    });
    sub.on('error', err => {
        console.error('[Redis:sub] error', err);
    });
    return sub;
}
