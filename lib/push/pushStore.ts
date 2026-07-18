// lib/push/pushStore.ts

/** 🔐 신규: token owner key 생성을 위한 hash */
import { createHash } from 'crypto'

import { redis } from '@/lib/redis/index'

type Token = string

const key = (userId: string) => `push:tokens:${userId}`

/** 🔐 신규: Lua에서 이전 owner의 token Set key 생성 시 사용 */
const TOKEN_KEY_PREFIX = 'push:tokens:'

/** 🔐 신규: raw FCM token을 Redis key에 노출하지 않기 위한 owner key */
const ownerKey = (token: Token) =>
  `push:token-owner:${createHash('sha256')
    .update(token)
    .digest('hex')}`

/** 🔥 전체 유저 목록 SET */
const USERS_KEY = 'push:users'

/** 🔐 신규: token 소유권 획득을 원자적으로 처리 */
const CLAIM_USER_PUSH_TOKEN_SCRIPT = `
local previousOwner = redis.call('GET', KEYS[1])

if previousOwner and previousOwner ~= ARGV[1] then
  redis.call(
    'SREM',
    ARGV[3] .. previousOwner,
    ARGV[2]
  )
end

redis.call('SADD', KEYS[2], ARGV[2])
redis.call('SET', KEYS[1], ARGV[1])
redis.call('SADD', KEYS[3], ARGV[1])

return previousOwner or ''
`

/** 🔐 신규: 현재 principal 소유 token 제거를 원자적으로 처리 */
const REMOVE_CLAIMED_USER_PUSH_TOKEN_SCRIPT = `
local owner = redis.call('GET', KEYS[1])

if owner and owner ~= ARGV[1] then
  return -1
end

local removed = redis.call(
  'SREM',
  KEYS[2],
  ARGV[2]
)

if owner == ARGV[1] then
  redis.call('DEL', KEYS[1])
end

return removed
`

/** ✅ 토큰 저장 (중복 자동 제거) */
export async function saveUserPushToken(
  userId: string,
  token: Token,
) {
  if (!userId || !token) return

  await redis.sadd(key(userId), token)

  /** 🔥 유저 목록 추가 */
  await redis.sadd(USERS_KEY, userId)
}

/** ✅ 토큰 목록 조회 */
export async function getUserPushTokens(
  userId: string,
): Promise<Token[]> {
  if (!userId) return []

  return await redis.smembers(key(userId))
}

/** ✅ 토큰 제거 */
export async function removeUserPushToken(
  userId: string,
  token: Token,
) {
  if (!userId || !token) return

  await redis.srem(key(userId), token)
}

/** 🔐 신규: API principal 기준 token 소유권 획득 */
export async function claimUserPushToken(
  userId: string,
  token: Token,
): Promise<void> {
  if (!userId || !token) return

  await redis.eval(
    CLAIM_USER_PUSH_TOKEN_SCRIPT,
    3,
    ownerKey(token),
    key(userId),
    USERS_KEY,
    userId,
    token,
    TOKEN_KEY_PREFIX,
  )
}

/** 🔐 신규: API principal 기준 token 등록 해제 */
export async function removeClaimedUserPushToken(
  userId: string,
  token: Token,
): Promise<boolean> {
  if (!userId || !token) {
    return false
  }

  const result = await redis.eval(
    REMOVE_CLAIMED_USER_PUSH_TOKEN_SCRIPT,
    2,
    ownerKey(token),
    key(userId),
    userId,
    token,
  )

  return result === 1 || result === '1'
}
