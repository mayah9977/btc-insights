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
const INSTALLATION_KEY_PREFIX = 'native:installation:'
const OWNER_USER_KEY_PREFIX = 'native:owner:user:'
const SURFACE_CREDENTIAL_BYTES = 32
const SURFACE_CREDENTIAL_LENGTH = 43
const SURFACE_CREATE_ATTEMPTS = 3

export const NATIVE_SURFACE_ROTATION_ATTEMPTS = 3

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
local installationKey = KEYS[2]

local revokedAt = redis.call('HGET', surfaceKey, 'revokedAt')
if revokedAt then
  return 'REVOKED'
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

local boundInstallationId = redis.call(
  'HGET',
  surfaceKey,
  'boundInstallationId'
)
local bindingGeneration = redis.call(
  'HGET',
  surfaceKey,
  'bindingGeneration'
)

if not boundInstallationId or not bindingGeneration then
  return 'REFRESHED'
end

if installationKey == '' then
  return 'REFRESHED'
end

local installationBoundSurfaceRef = redis.call(
  'HGET',
  installationKey,
  'boundSurfaceRef'
)
local installationGeneration = redis.call(
  'HGET',
  installationKey,
  'surfaceBindingGeneration'
)

if
  installationBoundSurfaceRef ~= ARGV[4] or
  installationGeneration ~= bindingGeneration
then
  return 'REFRESHED'
end

redis.call(
  'HSET',
  installationKey,
  'surfaceBindingExpiresAt', ARGV[2],
  'updatedAt', ARGV[1]
)

local activeOwnerKind = redis.call(
  'HGET',
  installationKey,
  'activeOwnerKind'
)
local activeOwnerRef = redis.call(
  'HGET',
  installationKey,
  'activeOwnerRef'
)
local credentialExpiresAt = redis.call(
  'HGET',
  installationKey,
  'credentialExpiresAt'
)

if
  activeOwnerKind == 'USER' and
  activeOwnerRef and
  credentialExpiresAt
then
  local effectiveExpiry = math.min(
    tonumber(credentialExpiresAt),
    tonumber(ARGV[2])
  )

  if effectiveExpiry > tonumber(ARGV[1]) then
    redis.call(
      'HSET',
      installationKey,
      'ownerAssociationExpiresAt', tostring(effectiveExpiry)
    )
    redis.call(
      'ZADD',
      ARGV[5] .. activeOwnerRef,
      effectiveExpiry,
      boundInstallationId
    )
  end
end

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

export type NativeValidatedSurface = NativeSurfaceBindingLease

export type NativeSurfaceRotationCandidate =
  NativeSurfaceBindingLease & {
    credential: string
  }

function sha256Hex(value: string): string {
  return createHash('sha256')
    .update(value, 'utf8')
    .digest('hex')
}

export function nativeSurfaceKey(
  surfaceRef: string,
): string {
  return `${SURFACE_KEY_PREFIX}${surfaceRef}`
}

function installationKey(
  installationId: string,
): string {
  return `${INSTALLATION_KEY_PREFIX}${installationId}`
}

function isValidRawSurfaceCredential(
  value: string,
): boolean {
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

export function getNativeSurfaceRefFromCredential(
  credential: string | null | undefined,
): string | null {
  if (
    !credential ||
    !isValidRawSurfaceCredential(credential)
  ) {
    return null
  }

  return sha256Hex(credential)
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

export function createNativeSurfaceRotationCandidate(
  nowMs = Date.now(),
): NativeSurfaceRotationCandidate {
  const credential = createRawSurfaceCredential()

  return {
    credential,
    surfaceRef: sha256Hex(credential),
    surfaceBindingExpiresAt: getNextExpiry(nowMs),
  }
}

export async function getValidatedNativeSurface(
  credential: string | null | undefined,
): Promise<NativeValidatedSurface | null> {
  if (!credential || !isValidRawSurfaceCredential(credential)) {
    return null
  }

  const surfaceRef = sha256Hex(credential)
  const stored = await redis.hmget(
    nativeSurfaceKey(surfaceRef),
    'createdAt',
    'expiresAt',
    'revokedAt',
  )

  if (
    !stored[0] ||
    !stored[1] ||
    stored[2]
  ) {
    return null
  }

  const expiresAt = Number(stored[1])
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return null
  }

  return {
    surfaceRef,
    surfaceBindingExpiresAt: expiresAt,
  }
}

async function refreshExistingSurface(
  credential: string,
  nowMs: number,
): Promise<NativeSurfaceBootstrapResult | null> {
  if (!isValidRawSurfaceCredential(credential)) {
    return null
  }

  const surfaceRef = sha256Hex(credential)
  const current = await redis.hmget(
    nativeSurfaceKey(surfaceRef),
    'expiresAt',
    'boundInstallationId',
    'revokedAt',
  )

  const currentExpiresAt = Number(current[0])
  if (
    !current[0] ||
    current[2] ||
    !Number.isFinite(currentExpiresAt) ||
    currentExpiresAt <= nowMs
  ) {
    return null
  }

  const boundInstallationId = current[1] || ''
  const expiresAt = getNextExpiry(nowMs)

  const result = await redis.eval(
    REFRESH_SURFACE_SCRIPT,
    2,
    nativeSurfaceKey(surfaceRef),
    boundInstallationId
      ? installationKey(boundInstallationId)
      : '',
    String(nowMs),
    String(expiresAt),
    String(NATIVE_SURFACE_TTL_SECONDS),
    surfaceRef,
    OWNER_USER_KEY_PREFIX,
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
      nativeSurfaceKey(surfaceRef),
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
