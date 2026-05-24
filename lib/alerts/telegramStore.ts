//lib/alerts/telegramStore.ts

import { redis } from '@/lib/redis/server'

/**
 * Redis Key 설계
 *
 * vip:telegram:user:{userId}  → userId별 chatId
 * vip:telegram:users          → 전체 Telegram chatId Set
 */

const USER_KEY_PREFIX = 'vip:telegram:user:'
const TELEGRAM_USERS_KEY = 'vip:telegram:users'

/**
 * 🔹 userId ↔ chatId 매핑 저장
 * 🔹 전체 자동발송 대상 Set에도 추가
 */
export async function setTelegramChatId(
  userId: string,
  chatId: string,
) {
  if (!userId || !chatId) return

  // 1️⃣ userId별 chatId 저장
  await redis.set(`${USER_KEY_PREFIX}${userId}`, chatId)

  // 2️⃣ 자동발송용 전체 Set에 추가 (중복 자동 방지)
  await redis.sadd(TELEGRAM_USERS_KEY, chatId)
}

/**
 * 🔹 특정 userId의 chatId 조회
 */
export async function getTelegramChatId(
  userId: string,
): Promise<string | null> {
  return redis.get(`${USER_KEY_PREFIX}${userId}`)
}

/**
 * 🔹 자동발송용 전체 Telegram 사용자 조회
 */
export async function getAllTelegramChatIds(): Promise<string[]> {
  return redis.smembers(TELEGRAM_USERS_KEY)
}

/**
 * 🔹 특정 chatId 제거 (차단/탈퇴 대비)
 */
export async function removeTelegramChatId(
  chatId: string,
) {
  await redis.srem(TELEGRAM_USERS_KEY, chatId)
}
