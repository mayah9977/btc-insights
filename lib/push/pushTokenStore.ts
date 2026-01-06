type Token = string

const userTokens = new Map<string, Set<Token>>()

export async function registerPushToken(
  userId: string,
  token: string
) {
  if (!userId || !token) return

  const set = userTokens.get(userId) ?? new Set<Token>()
  set.add(token)
  userTokens.set(userId, set)
}

export async function unregisterPushToken(
  userId: string,
  token: string
) {
  const set = userTokens.get(userId)
  if (!set) return

  set.delete(token)
  if (set.size === 0) userTokens.delete(userId)
}

export async function getUserPushTokens(
  userId: string
): Promise<string[]> {
  return Array.from(userTokens.get(userId) ?? [])
}
