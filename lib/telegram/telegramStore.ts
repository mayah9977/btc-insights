import { TelegramUser } from './telegramTypes';

// DEV: in-memory (운영 시 Redis/DB)
const map = new Map<string, TelegramUser>();

export async function saveTelegramUser(user: TelegramUser) {
  map.set(user.userId, user);
}

export async function getTelegramByUserId(userId: string) {
  return map.get(userId) ?? null;
}
