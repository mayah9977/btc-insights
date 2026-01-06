const map = new Map<string, string>(); // userId -> chatId

export async function setTelegramChatId(userId: string, chatId: string) {
  if (!userId || !chatId) return;
  map.set(userId, chatId);
}

export async function getTelegramChatId(userId: string) {
  return map.get(userId) ?? null;
}
