import { redis } from '@/lib/redis/index'

type Token = string

const key = (userId: string) => `push:tokens:${userId}`

/** 🔥 전체 유저 목록 SET */
const USERS_KEY = 'push:users'

/** ✅ 토큰 저장 (중복 자동 제거) */
export async function saveUserPushToken(
  userId: string,
  token: Token
) {
  if (!userId || !token) return

  await redis.sadd(key(userId), token)

  /** 🔥 유저 목록 추가 */
  await redis.sadd(USERS_KEY, userId)

  console.log('[PUSH STORE] saved token', userId, token)
}

/** ✅ 토큰 목록 조회 */
export async function getUserPushTokens(
  userId: string
): Promise<Token[]> {
  if (!userId) return []

  return await redis.smembers(key(userId))
}

/** ✅ 토큰 제거 */
export async function removeUserPushToken(
  userId: string,
  token: Token
) {
  if (!userId || !token) return

  await redis.srem(key(userId), token)
}
