/**
 * ❌ DEPRECATED - 사용 금지
 * Redis 기반 pushStore.ts 사용해야 함
 */

function throwError(fn: string) {
  throw new Error(
    `[PUSH][DEPRECATED] ${fn} 사용 금지. pushStore.ts (Redis) 사용하세요.`
  )
}

export async function registerPushToken(
  userId: string,
  token: string
) {
  console.error('[PUSH][BLOCKED] registerPushToken', userId, token)
  throwError('registerPushToken')
}

export async function unregisterPushToken(
  userId: string,
  token: string
) {
  console.error('[PUSH][BLOCKED] unregisterPushToken', userId, token)
  throwError('unregisterPushToken')
}

export async function removeUserPushToken(
  userId: string,
  token: string
) {
  console.error('[PUSH][BLOCKED] removeUserPushToken', userId, token)
  throwError('removeUserPushToken')
}

export async function getUserPushTokens(
  userId: string
): Promise<string[]> {
  console.error('[PUSH][BLOCKED] getUserPushTokens', userId)
  throwError('getUserPushTokens')
  return []
}
