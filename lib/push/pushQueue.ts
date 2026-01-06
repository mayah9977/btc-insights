import Redis from 'ioredis'
import { sendWebPush, type WebPushPayload } from './sendWebPush'

const redis = new Redis(process.env.REDIS_URL!)
const QUEUE_KEY = 'push:retry'

export async function enqueuePush(payload: WebPushPayload) {
  await redis.lpush(QUEUE_KEY, JSON.stringify(payload))
}

export async function processPushQueue() {
  while (true) {
    const item = await redis.rpop(QUEUE_KEY)
    if (!item) break

    try {
      const payload = JSON.parse(item) as WebPushPayload
      await sendWebPush(payload)
    } catch (e) {
      console.error('[PUSH][RETRY]', e)
      await redis.lpush(QUEUE_KEY, item)
      break
    }
  }
}
