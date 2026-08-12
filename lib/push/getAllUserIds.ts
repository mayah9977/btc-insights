//lib/push/getAIUserIds.ts

import { redis } from '@/lib/redis/index'

const USERS_KEY = 'push:users'

export async function getAllUserIds(): Promise<string[]> {
  try {
    const users = await redis.smembers(USERS_KEY)
    return users ?? []
  } catch {
    console.error('[PUSH] getAllUserIds error')
    return []
  }
}
