/**
 * ❌ DEPRECATED - 사용 금지
 * Redis 기반 pushStore.ts 사용해야 함
 */

function throwError(fn: string) {
  throw new Error(
    `[PUSH][DEPRECATED][alerts] ${fn} 사용 금지. pushStore.ts 사용하세요.`
  )
}

export async function registerPushToken(
  userId: string,
  token: string
) {
  console.error('[PUSH][BLOCKED][alerts] registerPushToken', userId, token)
  throwError('registerPushToken')
}

export async function unregisterPushToken(
  userId: string,
  token: string
) {
  console.error('[PUSH][BLOCKED][alerts] unregisterPushToken', userId, token)
  throwError('unregisterPushToken')
}

export async function listPushTokens(
  userId: string
): Promise<string[]> {
  console.error('[PUSH][BLOCKED][alerts] listPushTokens', userId)
  throwError('listPushTokens')
  return []
}
