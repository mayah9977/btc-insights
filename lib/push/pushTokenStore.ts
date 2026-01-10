type Token = string;

/**
 * ⚠️ 개발용 메모리 스토어
 * - 서버 재시작 시 토큰 초기화됨
 */
const userTokens = new Map<string, Set<Token>>();

export async function registerPushToken(
  userId: string,
  token: string
) {
  if (!userId || !token) return;

  const set = userTokens.get(userId) ?? new Set<Token>();
  set.add(token);
  userTokens.set(userId, set);

  console.log("[PUSH][REGISTER]", userId, Array.from(set));
}

export async function unregisterPushToken(
  userId: string,
  token: string
) {
  const set = userTokens.get(userId);
  if (!set) return;

  set.delete(token);
  if (set.size === 0) userTokens.delete(userId);

  console.log("[PUSH][UNREGISTER]", userId, token);
}

/** ❗ pushSender 에서 사용하는 이름 */
export async function removeUserPushToken(
  userId: string,
  token: string
) {
  return unregisterPushToken(userId, token);
}

export async function getUserPushTokens(
  userId: string
): Promise<string[]> {
  const tokens = Array.from(userTokens.get(userId) ?? []);
  console.log("[PUSH][TOKENS]", userId, tokens);
  return tokens;
}
