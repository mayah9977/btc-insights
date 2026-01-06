import { redis } from '@/lib/redis'

type Token = string

const key = (userId: string) => `push:tokens:${userId}`

/** ✅ 토큰 저장 (중복 자동 제거) */
export async function saveUserPushToken(
  userId: string,
  token: Token
) {
  if (!userId || !token) return

  await redis.sadd(key(userId), token)

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
