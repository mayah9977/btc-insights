import Redis from 'ioredis'

/* =========================
 * Environment Validation
 * ========================= */
if (!process.env.REDIS_URL) {
  throw new Error('[Redis] REDIS_URL is not defined')
}

/* =========================
 * Redis Client (Base)
 * ========================= */
export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // ✅ Pub/Sub, SSE에서 필수
  enableReadyCheck: true,
  reconnectOnError(err) {
    const message = err?.message || ''
    if (
      message.includes('READONLY') ||
      message.includes('ECONNRESET') ||
      message.includes('ETIMEDOUT')
    ) {
      return true
    }
    return false
  },
})

/* =========================
 * Logging
 * ========================= */
redis.on('connect', () => {
  console.log('[Redis] connected')
})

redis.on('ready', () => {
  console.log('[Redis] ready')
})

redis.on('reconnecting', (delay: number) => {
  console.warn('[Redis] reconnecting...', delay)
})

redis.on('error', err => {
  console.error('[Redis] error', err)
})

redis.on('close', () => {
  console.warn('[Redis] connection closed')
})

/* =========================
 * Helpers
 * ========================= */

/**
 * Redis subscriber 전용 client 생성
 * - Pub/Sub은 반드시 duplicate 사용
 */
export function createRedisSubscriber() {
  const sub = redis.duplicate()

  sub.on('connect', () => {
    console.log('[Redis:sub] connected')
  })

  sub.on('error', err => {
    console.error('[Redis:sub] error', err)
  })

  return sub
}
