// lib/native/nativeHandoffStore.ts

import { createHash, randomBytes } from 'crypto'

import {
  getNativeInstallationCredentialVerificationInput,
  verifyInstallationCredential,
} from '@/lib/native/nativeInstallationStore'
import { redis } from '@/lib/redis/index'

const HANDOFF_KEY_PREFIX = 'native:handoff:'
const HANDOFF_RATE_KEY_PREFIX = 'native:handoff-rate:'

export const HANDOFF_TTL_SECONDS = 60
export const HANDOFF_CREATE_RATE_LIMIT_WINDOW_SECONDS = 60
export const HANDOFF_CREATE_RATE_LIMIT_MAX = 10
export const HANDOFF_REDEEM_RATE_LIMIT_WINDOW_SECONDS = 60
export const HANDOFF_REDEEM_RATE_LIMIT_MAX = 30

const HANDOFF_CODE_BYTES = 32
const HANDOFF_CODE_ATTEMPTS = 3

const CREATE_HANDOFF_SCRIPT = `
local handoffKey = KEYS[1]

if redis.call('EXISTS', handoffKey) == 1 then
  return 'EXISTS'
end

redis.call(
  'HSET',
  handoffKey,
  'principalKind', ARGV[1],
  'principalRef', ARGV[2],
  'createdAt', ARGV[3]
)
redis.call('EXPIRE', handoffKey, ARGV[4])

return 'CREATED'
`

const REDEEM_HANDOFF_SCRIPT = `
local installationKey = KEYS[1]
local handoffKey = KEYS[2]

local storedCredentialHash = redis.call('HGET', installationKey, 'credentialHash')
local storedCredentialExpiresAt = redis.call('HGET', installationKey, 'credentialExpiresAt')

if not storedCredentialHash or not storedCredentialExpiresAt then
  return 'AUTH_FAILED'
end

if storedCredentialHash ~= ARGV[1] then
  return 'AUTH_FAILED'
end

if tonumber(storedCredentialExpiresAt) <= tonumber(ARGV[2]) then
  return 'AUTH_FAILED'
end

local principalKind = redis.call('HGET', handoffKey, 'principalKind')
local principalRef = redis.call('HGET', handoffKey, 'principalRef')
local createdAt = redis.call('HGET', handoffKey, 'createdAt')

if not principalKind or not principalRef or not createdAt then
  return 'HANDOFF_NOT_FOUND'
end

if principalKind == 'anonymous' then
  local linkedAnonymousOwnerRef = redis.call(
    'HGET',
    installationKey,
    'linkedAnonymousOwnerRef'
  )
  if not linkedAnonymousOwnerRef then
    redis.call('HSET', installationKey, 'linkedAnonymousOwnerRef', principalRef)
  end
  redis.call(
    'HSET',
    installationKey,
    'activeOwnerKind', 'ANONYMOUS_INSTALLATION',
    'activeOwnerRef', principalRef,
    'ownerLinkedAt', ARGV[2],
    'updatedAt', ARGV[2]
  )
elseif principalKind == 'authenticated' then
  redis.call(
    'HSET',
    installationKey,
    'activeOwnerKind', 'USER',
    'activeOwnerRef', principalRef,
    'ownerLinkedAt', ARGV[2],
    'updatedAt', ARGV[2]
  )
else
  return 'HANDOFF_INVALID'
end

redis.call('DEL', handoffKey)

if principalKind == 'anonymous' then
  return 'LINKED_ANONYMOUS'
end

return 'LINKED_USER'
`

const RATE_LIMIT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
`

function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function handoffKey(code: string): string {
  return `${HANDOFF_KEY_PREFIX}${sha256Hex(code)}`
}

export type NativeHandoffPrincipal = {
  kind: 'authenticated' | 'anonymous'
  ref: string
}

export async function createNativeHandoff(
  principal: NativeHandoffPrincipal,
): Promise<{ launchCode: string }> {
  const nowMs = Date.now()

  for (let attempt = 0; attempt < HANDOFF_CODE_ATTEMPTS; attempt += 1) {
    const code = randomBytes(HANDOFF_CODE_BYTES).toString('base64url')
    const result = await redis.eval(
      CREATE_HANDOFF_SCRIPT,
      1,
      handoffKey(code),
      principal.kind,
      principal.ref,
      String(nowMs),
      String(HANDOFF_TTL_SECONDS),
    )

    if (result === 'CREATED') {
      return { launchCode: code }
    }

    if (result !== 'EXISTS') {
      throw new Error('NATIVE_HANDOFF_CREATE_FAILED')
    }
  }

  throw new Error('NATIVE_HANDOFF_CREATE_COLLISION')
}

export type RedeemNativeHandoffResult =
  | 'LINKED_ANONYMOUS'
  | 'LINKED_USER'
  | 'AUTH_FAILED'
  | 'HANDOFF_NOT_FOUND'
  | 'HANDOFF_INVALID'

export async function redeemNativeHandoff(
  code: string,
  installationId: string,
  installationCredential: string,
): Promise<RedeemNativeHandoffResult> {
  if (!(await verifyInstallationCredential(installationId, installationCredential))) {
    return 'AUTH_FAILED'
  }

  const verification = getNativeInstallationCredentialVerificationInput(
    installationId,
    installationCredential,
  )
  const nowMs = Date.now()

  const result = await redis.eval(
    REDEEM_HANDOFF_SCRIPT,
    2,
    verification.installationKey,
    handoffKey(code),
    verification.credentialHash,
    String(nowMs),
  )

  if (
    result === 'LINKED_ANONYMOUS' ||
    result === 'LINKED_USER' ||
    result === 'AUTH_FAILED' ||
    result === 'HANDOFF_NOT_FOUND' ||
    result === 'HANDOFF_INVALID'
  ) {
    return result
  }

  throw new Error('NATIVE_HANDOFF_REDEEM_FAILED')
}

export type NativeHandoffRateLimitKind = 'create' | 'redeem'

export async function checkNativeHandoffRateLimit(
  kind: NativeHandoffRateLimitKind,
  trustedClientKey: string,
): Promise<{ allowed: boolean; count: number }> {
  const windowSeconds =
    kind === 'create'
      ? HANDOFF_CREATE_RATE_LIMIT_WINDOW_SECONDS
      : HANDOFF_REDEEM_RATE_LIMIT_WINDOW_SECONDS
  const max =
    kind === 'create'
      ? HANDOFF_CREATE_RATE_LIMIT_MAX
      : HANDOFF_REDEEM_RATE_LIMIT_MAX
  const rateKey = `${HANDOFF_RATE_KEY_PREFIX}${kind}:${sha256Hex(trustedClientKey)}`
  const count = Number(
    await redis.eval(
      RATE_LIMIT_SCRIPT,
      1,
      rateKey,
      String(windowSeconds),
    ),
  )

  return {
    allowed: Number.isFinite(count) && count <= max,
    count,
  }
}
