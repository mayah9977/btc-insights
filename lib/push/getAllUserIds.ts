import { redis } from '@/lib/redis/index'

const USERS_KEY = 'push:users'

export async function getAllUserIds(): Promise<string[]> {
  try {
    const users = await redis.smembers(USERS_KEY)
    console.log('[PUSH] all users:', users)
    return users ?? []
  } catch (e) {
    console.error('[PUSH] getAllUserIds error', e)
    return []
  }
}
