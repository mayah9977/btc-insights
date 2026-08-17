// lib/native/nativeInstallationStore.ts

import { createHash, randomBytes, timingSafeEqual } from 'crypto'

import { redis } from '@/lib/redis/index'

const INSTALLATION_KEY_PREFIX = 'native:installation:'
const INSTALLATION_TOKEN_KEY_PREFIX = 'native:installation-token:'
const TOKEN_OWNER_KEY_PREFIX = 'native:token-owner:'
const OWNER_USER_KEY_PREFIX = 'native:owner:user:'
const OWNER_ANONYMOUS_KEY_PREFIX = 'native:owner:anonymous:'
const SURFACE_KEY_PREFIX = 'native:web-surface:'
const RATE_KEY_PREFIX = 'native:rate:'

export const INSTALLATION_CREDENTIAL_TTL_SECONDS =
  60 * 60 * 24 * 365

export const NATIVE_OWNER_DEVICE_CAP = 10

export const REGISTER_RATE_LIMIT_WINDOW_SECONDS = 60
export const REGISTER_RATE_LIMIT_MAX = 10
export const TOKEN_RATE_LIMIT_WINDOW_SECONDS = 60
export const TOKEN_RATE_LIMIT_MAX = 60

const CREDENTIAL_BYTES = 32
const SHA256_HEX_LENGTH = 64

const CREATE_INSTALLATION_SCRIPT = `
local installationKey = KEYS[1]

if redis.call('EXISTS', installationKey) == 1 then
  return 'EXISTS'
end

redis.call(
  'HSET',
  installationKey,
  'credentialHash', ARGV[1],
  'credentialExpiresAt', ARGV[2],
  'createdAt', ARGV[3],
  'updatedAt', ARGV[3]
)
redis.call('EXPIRE', installationKey, ARGV[4])

return 'CREATED'
`

const REPLACE_NATIVE_TOKEN_SCRIPT = `
local installationKey = KEYS[1]
local installationTokenKey = KEYS[2]
local newTokenOwnerKey = KEYS[3]

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

local newTokenOwner = redis.call('GET', newTokenOwnerKey)
if newTokenOwner and newTokenOwner ~= ARGV[3] then
  return 'TOKEN_CONFLICT'
end

local currentToken = redis.call('HGET', installationTokenKey, 'token')
local currentTokenHash = redis.call('HGET', installationTokenKey, 'tokenHash')

if currentToken and currentTokenHash and currentToken == ARGV[4] and currentTokenHash == ARGV[5] then
  redis.call('SET', newTokenOwnerKey, ARGV[3])
  redis.call('HSET', installationKey, 'credentialExpiresAt', ARGV[6], 'updatedAt', ARGV[2])
  redis.call('EXPIRE', installationKey, ARGV[7])
  redis.call('EXPIRE', installationTokenKey, ARGV[7])
  redis.call('EXPIRE', newTokenOwnerKey, ARGV[7])
  return 'IDEMPOTENT'
end

if currentTokenHash then
  local oldTokenOwnerKey = ARGV[8] .. currentTokenHash
  local oldOwner = redis.call('GET', oldTokenOwnerKey)
  if oldOwner == ARGV[3] then
    redis.call('DEL', oldTokenOwnerKey)
  end
end

redis.call(
  'HSET',
  installationTokenKey,
  'token', ARGV[4],
  'tokenHash', ARGV[5],
  'updatedAt', ARGV[2]
)
redis.call('SET', newTokenOwnerKey, ARGV[3])
redis.call('HSET', installationKey, 'credentialExpiresAt', ARGV[6], 'updatedAt', ARGV[2])
redis.call('EXPIRE', installationKey, ARGV[7])
redis.call('EXPIRE', installationTokenKey, ARGV[7])
redis.call('EXPIRE', newTokenOwnerKey, ARGV[7])

return 'UPDATED'
`

const REPAIR_OWNER_INDEXES_SCRIPT = `
local installationKey = KEYS[1]
local surfaceKey = KEYS[2]

local installationId = ARGV[1]
local nowMs = tonumber(ARGV[2])
local newCredentialExpiresAt = tonumber(ARGV[3])
local userPrefix = ARGV[4]
local anonymousPrefix = ARGV[5]
local expectedSurfaceRef = ARGV[6]

local linkedAnonymousOwnerRef = redis.call(
  'HGET',
  installationKey,
  'linkedAnonymousOwnerRef'
)

if linkedAnonymousOwnerRef then
  local anonymousKey = anonymousPrefix .. linkedAnonymousOwnerRef
  redis.call('ZREMRANGEBYSCORE', anonymousKey, '-inf', nowMs)
  redis.call(
    'ZADD',
    anonymousKey,
    newCredentialExpiresAt,
    installationId
  )
end

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

if activeOwnerKind ~= 'USER' or not activeOwnerRef then
  return 'REPAIRED'
end

local userKey = userPrefix .. activeOwnerRef
redis.call('ZREMRANGEBYSCORE', userKey, '-inf', nowMs)

local boundSurfaceRef = redis.call(
  'HGET',
  installationKey,
  'boundSurfaceRef'
)
local installationGeneration = redis.call(
  'HGET',
  installationKey,
  'surfaceBindingGeneration'
)
local surfaceBindingExpiresAt = redis.call(
  'HGET',
  installationKey,
  'surfaceBindingExpiresAt'
)

if
  not boundSurfaceRef or
  not installationGeneration or
  not surfaceBindingExpiresAt or
  boundSurfaceRef ~= expectedSurfaceRef or
  tonumber(surfaceBindingExpiresAt) <= nowMs or
  surfaceKey == ''
then
  redis.call('ZREM', userKey, installationId)
  return 'REPAIRED'
end

local surfaceInstallationId = redis.call(
  'HGET',
  surfaceKey,
  'boundInstallationId'
)
local surfaceGeneration = redis.call(
  'HGET',
  surfaceKey,
  'bindingGeneration'
)
local surfaceExpiresAt = redis.call(
  'HGET',
  surfaceKey,
  'expiresAt'
)

if
  surfaceInstallationId ~= installationId or
  surfaceGeneration ~= installationGeneration or
  not surfaceExpiresAt or
  tonumber(surfaceExpiresAt) <= nowMs
then
  redis.call('ZREM', userKey, installationId)
  return 'REPAIRED'
end

local effectiveExpiry = math.min(
  newCredentialExpiresAt,
  tonumber(surfaceBindingExpiresAt),
  tonumber(surfaceExpiresAt)
)

if effectiveExpiry <= nowMs then
  redis.call('ZREM', userKey, installationId)
  return 'REPAIRED'
end

redis.call(
  'HSET',
  installationKey,
  'ownerAssociationExpiresAt', tostring(effectiveExpiry)
)
redis.call('ZADD', userKey, effectiveExpiry, installationId)

return 'REPAIRED'
`

const REMOVE_INVALID_NATIVE_TOKEN_SCRIPT = `
local installationTokenKey = KEYS[1]
local tokenOwnerKey = KEYS[2]

local currentToken = redis.call('HGET', installationTokenKey, 'token')
local currentTokenHash = redis.call('HGET', installationTokenKey, 'tokenHash')

if not currentToken or not currentTokenHash then
  return 'NOT_FOUND'
end

if currentToken ~= ARGV[1] or currentTokenHash ~= ARGV[2] then
  return 'MISMATCH'
end

local owner = redis.call('GET', tokenOwnerKey)
if owner and owner ~= ARGV[3] then
  return 'OWNER_MISMATCH'
end

redis.call('DEL', installationTokenKey)
if owner == ARGV[3] then
  redis.call('DEL', tokenOwnerKey)
end

return 'REMOVED'
`

const RATE_LIMIT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
`

function installationKey(
  installationId: string,
): string {
  return `${INSTALLATION_KEY_PREFIX}${installationId}`
}

function installationTokenKey(
  installationId: string,
): string {
  return `${INSTALLATION_TOKEN_KEY_PREFIX}${installationId}`
}

function nativeSurfaceKey(
  surfaceRef: string,
): string {
  return `${SURFACE_KEY_PREFIX}${surfaceRef}`
}

function ownerUserKey(userId: string): string {
  return `${OWNER_USER_KEY_PREFIX}${userId}`
}

function ownerAnonymousKey(
  anonymousOwnerRef: string,
): string {
  return `${OWNER_ANONYMOUS_KEY_PREFIX}${anonymousOwnerRef}`
}

function sha256Hex(value: string): string {
  return createHash('sha256')
    .update(value, 'utf8')
    .digest('hex')
}

function tokenOwnerKeyFromHash(
  tokenHash: string,
): string {
  return `${TOKEN_OWNER_KEY_PREFIX}${tokenHash}`
}

function safeEqualHex(
  leftHex: string,
  rightHex: string,
): boolean {
  if (
    leftHex.length !== SHA256_HEX_LENGTH ||
    rightHex.length !== SHA256_HEX_LENGTH
  ) {
    return false
  }

  const left = Buffer.from(leftHex, 'hex')
  const right = Buffer.from(rightHex, 'hex')

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}

export type NativeInstallationCredentialVerificationInput = {
  installationKey: string
  credentialHash: string
}

export function getNativeInstallationCredentialVerificationInput(
  installationId: string,
  installationCredential: string,
): NativeInstallationCredentialVerificationInput {
  return {
    installationKey: installationKey(installationId),
    credentialHash: sha256Hex(installationCredential),
  }
}

export type CreateInstallationResult =
  | { status: 'CREATED'; credential: string }
  | { status: 'EXISTS' }

export async function createInstallationCredential(
  installationId: string,
): Promise<CreateInstallationResult> {
  const credential = randomBytes(CREDENTIAL_BYTES)
    .toString('base64url')
  const credentialHash = sha256Hex(credential)
  const nowMs = Date.now()
  const expiresAtMs =
    nowMs + INSTALLATION_CREDENTIAL_TTL_SECONDS * 1000

  const result = await redis.eval(
    CREATE_INSTALLATION_SCRIPT,
    1,
    installationKey(installationId),
    credentialHash,
    String(expiresAtMs),
    String(nowMs),
    String(INSTALLATION_CREDENTIAL_TTL_SECONDS),
  )

  if (result === 'CREATED') {
    return { status: 'CREATED', credential }
  }

  if (result === 'EXISTS') {
    return { status: 'EXISTS' }
  }

  throw new Error('NATIVE_INSTALLATION_CREATE_FAILED')
}

export async function verifyInstallationCredential(
  installationId: string,
  installationCredential: string,
): Promise<boolean> {
  const stored = await redis.hmget(
    installationKey(installationId),
    'credentialHash',
    'credentialExpiresAt',
  )

  const storedCredentialHash = stored[0]
  const storedCredentialExpiresAt = stored[1]

  if (!storedCredentialHash || !storedCredentialExpiresAt) {
    return false
  }

  const expiresAtMs = Number(storedCredentialExpiresAt)
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    return false
  }

  return safeEqualHex(
    storedCredentialHash,
    sha256Hex(installationCredential),
  )
}

export type ReplaceNativeTokenResult =
  | 'UPDATED'
  | 'IDEMPOTENT'
  | 'AUTH_FAILED'
  | 'TOKEN_CONFLICT'

export async function replaceNativeFcmToken(
  installationId: string,
  installationCredential: string,
  token: string,
): Promise<ReplaceNativeTokenResult> {
  const credentialHash = sha256Hex(
    installationCredential,
  )

  if (
    !(await verifyInstallationCredential(
      installationId,
      installationCredential,
    ))
  ) {
    return 'AUTH_FAILED'
  }

  const tokenHash = sha256Hex(token)
  const nowMs = Date.now()
  const expiresAtMs =
    nowMs + INSTALLATION_CREDENTIAL_TTL_SECONDS * 1000

  const result = await redis.eval(
    REPLACE_NATIVE_TOKEN_SCRIPT,
    3,
    installationKey(installationId),
    installationTokenKey(installationId),
    tokenOwnerKeyFromHash(tokenHash),
    credentialHash,
    String(nowMs),
    installationId,
    token,
    tokenHash,
    String(expiresAtMs),
    String(INSTALLATION_CREDENTIAL_TTL_SECONDS),
    TOKEN_OWNER_KEY_PREFIX,
  )

  if (
    result !== 'UPDATED' &&
    result !== 'IDEMPOTENT' &&
    result !== 'AUTH_FAILED' &&
    result !== 'TOKEN_CONFLICT'
  ) {
    throw new Error('NATIVE_TOKEN_REPLACE_FAILED')
  }

  if (result === 'UPDATED' || result === 'IDEMPOTENT') {
    const binding = await redis.hmget(
      installationKey(installationId),
      'boundSurfaceRef',
    )

    const surfaceRef = binding[0] || ''
    const repairResult = await redis.eval(
      REPAIR_OWNER_INDEXES_SCRIPT,
      2,
      installationKey(installationId),
      surfaceRef ? nativeSurfaceKey(surfaceRef) : '',
      installationId,
      String(nowMs),
      String(expiresAtMs),
      OWNER_USER_KEY_PREFIX,
      OWNER_ANONYMOUS_KEY_PREFIX,
      surfaceRef,
    )

    if (repairResult !== 'REPAIRED') {
      throw new Error('NATIVE_OWNER_INDEX_REPAIR_FAILED')
    }
  }

  return result
}

export type RemoveInvalidNativeTokenResult =
  | 'REMOVED'
  | 'NOT_FOUND'
  | 'MISMATCH'
  | 'OWNER_MISMATCH'

export async function removeInvalidNativeFcmToken(
  installationId: string,
  token: string,
): Promise<RemoveInvalidNativeTokenResult> {
  const tokenHash = sha256Hex(token)
  const result = await redis.eval(
    REMOVE_INVALID_NATIVE_TOKEN_SCRIPT,
    2,
    installationTokenKey(installationId),
    tokenOwnerKeyFromHash(tokenHash),
    token,
    tokenHash,
    installationId,
  )

  if (
    result === 'REMOVED' ||
    result === 'NOT_FOUND' ||
    result === 'MISMATCH' ||
    result === 'OWNER_MISMATCH'
  ) {
    return result
  }

  throw new Error('NATIVE_TOKEN_REMOVE_FAILED')
}

export type NativeOwnerLookup =
  | {
      kind: 'USER'
      ref: string
    }
  | {
      kind: 'ANONYMOUS_INSTALLATION'
      ref: string
    }

export type NativeOwnerInstallationCandidate = {
  installationId: string
  credentialExpiresAt: number
  ownerAssociationExpiresAt: number
}

export type NativeOwnerLookupResult =
  | {
      status: 'OK'
      installations: NativeOwnerInstallationCandidate[]
    }
  | {
      status: 'OWNER_INDEX_OVERFLOW'
      installations: []
    }

export async function getNativeOwnerInstallationCandidates(
  owner: NativeOwnerLookup,
): Promise<NativeOwnerLookupResult> {
  const nowMs = Date.now()
  const indexKey =
    owner.kind === 'USER'
      ? ownerUserKey(owner.ref)
      : ownerAnonymousKey(owner.ref)

  await redis.zremrangebyscore(
    indexKey,
    '-inf',
    nowMs,
  )

  const count = Number(await redis.zcard(indexKey))
  if (
    !Number.isFinite(count) ||
    count > NATIVE_OWNER_DEVICE_CAP
  ) {
    return {
      status: 'OWNER_INDEX_OVERFLOW',
      installations: [],
    }
  }

  const installationIds = await redis.zrange(
    indexKey,
    0,
    -1,
  )

  if (installationIds.length > NATIVE_OWNER_DEVICE_CAP) {
    return {
      status: 'OWNER_INDEX_OVERFLOW',
      installations: [],
    }
  }

  const installations: NativeOwnerInstallationCandidate[] = []

  for (const installationId of installationIds) {
    const fields = await redis.hmget(
      installationKey(installationId),
      'credentialExpiresAt',
      'activeOwnerKind',
      'activeOwnerRef',
      'linkedAnonymousOwnerRef',
      'ownerAssociationExpiresAt',
      'boundSurfaceRef',
      'surfaceBindingGeneration',
      'surfaceBindingExpiresAt',
    )

    const credentialExpiresAt = Number(fields[0])
    if (
      !Number.isFinite(credentialExpiresAt) ||
      credentialExpiresAt <= nowMs
    ) {
      continue
    }

    if (owner.kind === 'ANONYMOUS_INSTALLATION') {
      if (fields[3] !== owner.ref) {
        continue
      }

      installations.push({
        installationId,
        credentialExpiresAt,
        ownerAssociationExpiresAt: credentialExpiresAt,
      })
      continue
    }

    if (
      fields[1] !== 'USER' ||
      fields[2] !== owner.ref
    ) {
      continue
    }

    const ownerAssociationExpiresAt = Number(fields[4])
    const surfaceRef = fields[5]
    const generation = fields[6]
    const surfaceBindingExpiresAt = Number(fields[7])

    if (
      !Number.isFinite(ownerAssociationExpiresAt) ||
      ownerAssociationExpiresAt <= nowMs ||
      !surfaceRef ||
      !generation ||
      !Number.isFinite(surfaceBindingExpiresAt) ||
      surfaceBindingExpiresAt <= nowMs
    ) {
      continue
    }

    const surfaceFields = await redis.hmget(
      nativeSurfaceKey(surfaceRef),
      'boundInstallationId',
      'bindingGeneration',
      'expiresAt',
    )

    const surfaceExpiresAt = Number(surfaceFields[2])
    if (
      surfaceFields[0] !== installationId ||
      surfaceFields[1] !== generation ||
      !Number.isFinite(surfaceExpiresAt) ||
      surfaceExpiresAt <= nowMs
    ) {
      continue
    }

    installations.push({
      installationId,
      credentialExpiresAt,
      ownerAssociationExpiresAt,
    })
  }

  return {
    status: 'OK',
    installations,
  }
}

export type NativeRateLimitKind = 'register' | 'token'

export async function checkNativeRateLimit(
  kind: NativeRateLimitKind,
  trustedClientKey: string,
): Promise<{ allowed: boolean; count: number }> {
  const windowSeconds =
    kind === 'register'
      ? REGISTER_RATE_LIMIT_WINDOW_SECONDS
      : TOKEN_RATE_LIMIT_WINDOW_SECONDS
  const max =
    kind === 'register'
      ? REGISTER_RATE_LIMIT_MAX
      : TOKEN_RATE_LIMIT_MAX

  const rateKey = `${RATE_KEY_PREFIX}${kind}:${sha256Hex(trustedClientKey)}`
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
