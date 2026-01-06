// lib/alerts/pushTokenStore.ts

const store = new Map<string, Set<string>>() // userId -> tokens

export async function registerPushToken(userId: string, token: string) {
  if (!store.has(userId)) {
    store.set(userId, new Set())
  }
  store.get(userId)!.add(token)

  console.log('[PUSH][REGISTER]', userId, token)
}

export async function unregisterPushToken(userId: string, token: string) {
  store.get(userId)?.delete(token)
  console.log('[PUSH][UNREGISTER]', userId, token)
}

export async function listPushTokens(userId: string): Promise<string[]> {
  return Array.from(store.get(userId) ?? [])
}
