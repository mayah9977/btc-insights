// lib/native/nativeSurfaceStore.ts

import { createHash, randomBytes } from 'crypto'

import { redis } from '@/lib/redis/index'

export const NATIVE_SURFACE_COOKIE_NAME =
  '__Host-the-whales-native-surface-v1'

export const NATIVE_SURFACE_TTL_SECONDS =
  60 * 60 * 24 * 365

export const NATIVE_SURFACE_RATE_LIMIT_WINDOW_SECONDS = 60
export const NATIVE_SURFACE_RATE_LIMIT_MAX = 30

const SURFACE_KEY_PREFIX = 'native:web-surface:'
const SURFACE_RATE_KEY_PREFIX = 'native:web-surface-rate:'
const SURFACE_CREDENTIAL_BYTES = 32
const SURFACE_CREDENTIAL_LENGTH = 43
const SURFACE_CREATE_ATTEMPTS = 3

const CREATE_SURFACE_SCRIPT = `
local surfaceKey = KEYS[1]

if redis.call('EXISTS', surfaceKey) == 1 then
  return 'EXISTS'
end

redis.call(
  'HSET',
  surfaceKey,
  'createdAt', ARGV[1],
  'updatedAt', ARGV[1],
  'expiresAt', ARGV[2]
)
redis.call('EXPIRE', surfaceKey, ARGV[3])

return 'CREATED'
`

const REFRESH_SURFACE_SCRIPT = `
local surfaceKey = KEYS[1]

if redis.call('EXISTS', surfaceKey) ~= 1 then
  return 'NOT_FOUND'
end

local createdAt = redis.call('HGET', surfaceKey, 'createdAt')
local expiresAt = redis.call('HGET', surfaceKey, 'expiresAt')

if not createdAt or not expiresAt then
  return 'INVALID'
end

local numericExpiresAt = tonumber(expiresAt)
if not numericExpiresAt or numericExpiresAt <= tonumber(ARGV[1]) then
  return 'EXPIRED'
end

redis.call(
  'HSET',
  surfaceKey,
  'updatedAt', ARGV[1],
  'expiresAt', ARGV[2]
)
redis.call('EXPIRE', surfaceKey, ARGV[3])

return 'REFRESHED'
`

const RATE_LIMIT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
`

export type NativeSurfaceBindingLease = {
  surfaceRef: string
  surfaceBindingExpiresAt: number
}

export type NativeUserAssociationExpiryInput = {
  installationCredentialExpiresAt: number
  surfaceBindingExpiresAt: number
}

export type NativeSurfaceBootstrapResult =
  NativeSurfaceBindingLease & {
    credential: string
    status: 'CREATED' | 'REFRESHED'
  }

function sha256Hex(value: string): string {
  return createHash('sha256')
    .update(value, 'utf8')
    .digest('hex')
}

function surfaceKey(surfaceRef: string): string {
  return `${SURFACE_KEY_PREFIX}${surfaceRef}`
}

function isValidRawSurfaceCredential(value: string): boolean {
  if (
    value.length !== SURFACE_CREDENTIAL_LENGTH ||
    !/^[A-Za-z0-9_-]{43}$/.test(value)
  ) {
    return false
  }

  try {
    const decoded = Buffer.from(value, 'base64url')
    return (
      decoded.length === SURFACE_CREDENTIAL_BYTES &&
      decoded.toString('base64url') === value
    )
  } catch {
    return false
  }
}

function createRawSurfaceCredential(): string {
  return randomBytes(SURFACE_CREDENTIAL_BYTES)
    .toString('base64url')
}

function getNextExpiry(nowMs: number): number {
  return nowMs + NATIVE_SURFACE_TTL_SECONDS * 1000
}

export function resolveNativeUserAssociationExpiresAt({
  installationCredentialExpiresAt,
  surfaceBindingExpiresAt,
}: NativeUserAssociationExpiryInput): number {
  return Math.min(
    installationCredentialExpiresAt,
    surfaceBindingExpiresAt,
  )
}

async function refreshExistingSurface(
  credential: string,
  nowMs: number,
): Promise<NativeSurfaceBootstrapResult | null> {
  if (!isValidRawSurfaceCredential(credential)) {
    return null
  }

  const surfaceRef = sha256Hex(credential)
  const expiresAt = getNextExpiry(nowMs)

  const result = await redis.eval(
    REFRESH_SURFACE_SCRIPT,
    1,
    surfaceKey(surfaceRef),
    String(nowMs),
    String(expiresAt),
    String(NATIVE_SURFACE_TTL_SECONDS),
  )

  if (result === 'REFRESHED') {
    return {
      status: 'REFRESHED',
      credential,
      surfaceRef,
      surfaceBindingExpiresAt: expiresAt,
    }
  }

  if (
    result === 'NOT_FOUND' ||
    result === 'INVALID' ||
    result === 'EXPIRED'
  ) {
    return null
  }

  throw new Error('NATIVE_SURFACE_REFRESH_FAILED')
}

async function createNewSurface(
  nowMs: number,
): Promise<NativeSurfaceBootstrapResult> {
  const expiresAt = getNextExpiry(nowMs)

  for (
    let attempt = 0;
    attempt < SURFACE_CREATE_ATTEMPTS;
    attempt += 1
  ) {
    const credential = createRawSurfaceCredential()
    const surfaceRef = sha256Hex(credential)

    const result = await redis.eval(
      CREATE_SURFACE_SCRIPT,
      1,
      surfaceKey(surfaceRef),
      String(nowMs),
      String(expiresAt),
      String(NATIVE_SURFACE_TTL_SECONDS),
    )

    if (result === 'CREATED') {
      return {
        status: 'CREATED',
        credential,
        surfaceRef,
        surfaceBindingExpiresAt: expiresAt,
      }
    }

    if (result !== 'EXISTS') {
      throw new Error('NATIVE_SURFACE_CREATE_FAILED')
    }
  }

  throw new Error('NATIVE_SURFACE_CREATE_COLLISION')
}

export async function bootstrapNativeWebSurface(
  existingCredential: string | null | undefined,
): Promise<NativeSurfaceBootstrapResult> {
  const nowMs = Date.now()

  if (existingCredential) {
    const refreshed = await refreshExistingSurface(
      existingCredential,
      nowMs,
    )

    if (refreshed) {
      return refreshed
    }
  }

  return createNewSurface(nowMs)
}

export async function checkNativeSurfaceRateLimit(
  trustedClientKey: string,
): Promise<{ allowed: boolean; count: number }> {
  const rateKey = `${SURFACE_RATE_KEY_PREFIX}${sha256Hex(trustedClientKey)}`

  const count = Number(
    await redis.eval(
      RATE_LIMIT_SCRIPT,
      1,
      rateKey,
      String(NATIVE_SURFACE_RATE_LIMIT_WINDOW_SECONDS),
    ),
  )

  return {
    allowed:
      Number.isFinite(count) &&
      count <= NATIVE_SURFACE_RATE_LIMIT_MAX,
    count,
  }
}
