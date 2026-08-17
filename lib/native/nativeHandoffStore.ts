// lib/native/nativeHandoffStore.ts

import { createHash, randomBytes } from 'crypto'

import {
  NATIVE_OWNER_DEVICE_CAP,
  getNativeInstallationCredentialVerificationInput,
  verifyInstallationCredential,
} from '@/lib/native/nativeInstallationStore'
import { redis } from '@/lib/redis/index'

const HANDOFF_KEY_PREFIX = 'native:handoff:'
const HANDOFF_RATE_KEY_PREFIX = 'native:handoff-rate:'
const SURFACE_KEY_PREFIX = 'native:web-surface:'
const INSTALLATION_KEY_PREFIX = 'native:installation:'
const OWNER_USER_KEY_PREFIX = 'native:owner:user:'
const OWNER_ANONYMOUS_KEY_PREFIX = 'native:owner:anonymous:'
const SURFACE_GENERATION_KEY = 'native:surface-binding-generation'

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
  'surfaceRef', ARGV[3],
  'surfaceExpiresAt', ARGV[4],
  'createdAt', ARGV[5]
)
redis.call('EXPIRE', handoffKey, ARGV[6])

return 'CREATED'
`

const REDEEM_HANDOFF_SCRIPT = `
local installationKey = KEYS[1]
local handoffKey = KEYS[2]
local surfaceKey = KEYS[3]
local generationKey = KEYS[4]

local credentialHash = ARGV[1]
local nowMs = tonumber(ARGV[2])
local installationId = ARGV[3]
local expectedSurfaceRef = ARGV[4]
local userPrefix = ARGV[5]
local anonymousPrefix = ARGV[6]
local installationPrefix = ARGV[7]
local surfacePrefix = ARGV[8]
local cap = tonumber(ARGV[9])

local storedCredentialHash = redis.call(
  'HGET',
  installationKey,
  'credentialHash'
)
local storedCredentialExpiresAt = redis.call(
  'HGET',
  installationKey,
  'credentialExpiresAt'
)

if not storedCredentialHash or not storedCredentialExpiresAt then
  return 'AUTH_FAILED'
end

if storedCredentialHash ~= credentialHash then
  return 'AUTH_FAILED'
end

local credentialExpiresAt = tonumber(storedCredentialExpiresAt)
if not credentialExpiresAt or credentialExpiresAt <= nowMs then
  return 'AUTH_FAILED'
end

local principalKind = redis.call(
  'HGET',
  handoffKey,
  'principalKind'
)
local principalRef = redis.call(
  'HGET',
  handoffKey,
  'principalRef'
)
local handoffSurfaceRef = redis.call(
  'HGET',
  handoffKey,
  'surfaceRef'
)
local handoffSurfaceExpiresAt = redis.call(
  'HGET',
  handoffKey,
  'surfaceExpiresAt'
)
local createdAt = redis.call(
  'HGET',
  handoffKey,
  'createdAt'
)

if
  not principalKind or
  not principalRef or
  not handoffSurfaceRef or
  not handoffSurfaceExpiresAt or
  not createdAt
then
  return 'HANDOFF_NOT_FOUND'
end

if
  principalKind ~= 'anonymous' and
  principalKind ~= 'authenticated'
then
  return 'HANDOFF_INVALID'
end

if handoffSurfaceRef ~= expectedSurfaceRef then
  return 'SURFACE_INVALID'
end

local handoffSurfaceExpiry = tonumber(handoffSurfaceExpiresAt)
if not handoffSurfaceExpiry or handoffSurfaceExpiry <= nowMs then
  return 'SURFACE_EXPIRED'
end

local surfaceExpiresAt = redis.call(
  'HGET',
  surfaceKey,
  'expiresAt'
)

if not surfaceExpiresAt then
  return 'SURFACE_INVALID'
end

local numericSurfaceExpiresAt = tonumber(surfaceExpiresAt)
if
  not numericSurfaceExpiresAt or
  numericSurfaceExpiresAt <= nowMs
then
  return 'SURFACE_EXPIRED'
end

if numericSurfaceExpiresAt < handoffSurfaceExpiry then
  return 'SURFACE_INVALID'
end

local linkedAnonymousOwnerRef = redis.call(
  'HGET',
  installationKey,
  'linkedAnonymousOwnerRef'
)

local targetOwnerKey = nil
local targetOwnerScore = nil

if principalKind == 'authenticated' then
  targetOwnerKey = userPrefix .. principalRef
  targetOwnerScore = math.min(
    credentialExpiresAt,
    handoffSurfaceExpiry,
    numericSurfaceExpiresAt
  )
else
  local anonymousTargetRef = linkedAnonymousOwnerRef or principalRef
  targetOwnerKey = anonymousPrefix .. anonymousTargetRef
  targetOwnerScore = credentialExpiresAt
end

redis.call(
  'ZREMRANGEBYSCORE',
  targetOwnerKey,
  '-inf',
  nowMs
)

local existingSurfaceInstallationId = redis.call(
  'HGET',
  surfaceKey,
  'boundInstallationId'
)
local existingSurfaceGeneration = redis.call(
  'HGET',
  surfaceKey,
  'bindingGeneration'
)

local oldInstallationKey = nil
local oldLinkedAnonymousOwnerRef = nil
local oldCredentialExpiresAt = 0
local oldBindingIsAuthoritative = false
local oldOwnerKind = nil
local oldOwnerRef = nil

if
  existingSurfaceInstallationId and
  existingSurfaceInstallationId ~= installationId
then
  oldInstallationKey =
    installationPrefix .. existingSurfaceInstallationId

  local oldBoundSurfaceRef = redis.call(
    'HGET',
    oldInstallationKey,
    'boundSurfaceRef'
  )
  local oldGeneration = redis.call(
    'HGET',
    oldInstallationKey,
    'surfaceBindingGeneration'
  )

  oldBindingIsAuthoritative =
    oldBoundSurfaceRef == expectedSurfaceRef and
    oldGeneration == existingSurfaceGeneration

  if oldBindingIsAuthoritative then
    oldOwnerKind = redis.call(
      'HGET',
      oldInstallationKey,
      'activeOwnerKind'
    )
    oldOwnerRef = redis.call(
      'HGET',
      oldInstallationKey,
      'activeOwnerRef'
    )
    oldLinkedAnonymousOwnerRef = redis.call(
      'HGET',
      oldInstallationKey,
      'linkedAnonymousOwnerRef'
    )
    oldCredentialExpiresAt = tonumber(
      redis.call(
        'HGET',
        oldInstallationKey,
        'credentialExpiresAt'
      ) or '0'
    )

    if
      oldLinkedAnonymousOwnerRef and
      oldCredentialExpiresAt > nowMs
    then
      local oldAnonymousKey =
        anonymousPrefix .. oldLinkedAnonymousOwnerRef

      redis.call(
        'ZREMRANGEBYSCORE',
        oldAnonymousKey,
        '-inf',
        nowMs
      )

      local oldAnonymousMember = redis.call(
        'ZSCORE',
        oldAnonymousKey,
        existingSurfaceInstallationId
      )

      if not oldAnonymousMember then
        local oldAnonymousCount = redis.call(
          'ZCARD',
          oldAnonymousKey
        )
        if oldAnonymousCount >= cap then
          return 'OWNER_DEVICE_LIMIT_REACHED'
        end
      end
    end
  end
end

local alreadyTargetMember = redis.call(
  'ZSCORE',
  targetOwnerKey,
  installationId
)

if not alreadyTargetMember then
  local targetCount = redis.call('ZCARD', targetOwnerKey)
  local targetRemovalCredit = 0

  if
    oldBindingIsAuthoritative and
    principalKind == 'authenticated' and
    oldOwnerKind == 'USER' and
    oldOwnerRef == principalRef
  then
    local oldTargetMember = redis.call(
      'ZSCORE',
      targetOwnerKey,
      existingSurfaceInstallationId
    )

    if oldTargetMember then
      targetRemovalCredit = 1
    end
  end

  if targetCount + 1 - targetRemovalCredit > cap then
    return 'OWNER_DEVICE_LIMIT_REACHED'
  end
end

local effectiveLinkedAnonymousOwnerRef =
  linkedAnonymousOwnerRef

if
  principalKind == 'anonymous' and
  not effectiveLinkedAnonymousOwnerRef
then
  effectiveLinkedAnonymousOwnerRef = principalRef
end

if effectiveLinkedAnonymousOwnerRef then
  local linkedAnonymousKey =
    anonymousPrefix .. effectiveLinkedAnonymousOwnerRef

  if linkedAnonymousKey ~= targetOwnerKey then
    redis.call(
      'ZREMRANGEBYSCORE',
      linkedAnonymousKey,
      '-inf',
      nowMs
    )

    local linkedMember = redis.call(
      'ZSCORE',
      linkedAnonymousKey,
      installationId
    )

    if not linkedMember then
      local linkedCount = redis.call('ZCARD', linkedAnonymousKey)
      if linkedCount >= cap then
        return 'OWNER_DEVICE_LIMIT_REACHED'
      end
    end
  end
end

if oldBindingIsAuthoritative then
  if oldOwnerKind == 'USER' and oldOwnerRef then
    redis.call(
      'ZREM',
      userPrefix .. oldOwnerRef,
      existingSurfaceInstallationId
    )
  end

  if
    oldLinkedAnonymousOwnerRef and
    oldCredentialExpiresAt > nowMs
  then
    redis.call(
      'ZADD',
      anonymousPrefix .. oldLinkedAnonymousOwnerRef,
      oldCredentialExpiresAt,
      existingSurfaceInstallationId
    )
    redis.call(
      'HSET',
      oldInstallationKey,
      'activeOwnerKind', 'ANONYMOUS_INSTALLATION',
      'activeOwnerRef', oldLinkedAnonymousOwnerRef,
      'ownerAssociationExpiresAt', tostring(oldCredentialExpiresAt),
      'updatedAt', tostring(nowMs)
    )
  else
    redis.call(
      'HSET',
      oldInstallationKey,
      'activeOwnerKind', 'UNASSOCIATED',
      'updatedAt', tostring(nowMs)
    )
    redis.call(
      'HDEL',
      oldInstallationKey,
      'activeOwnerRef',
      'ownerAssociationExpiresAt'
    )
  end

  redis.call(
    'HDEL',
    oldInstallationKey,
    'boundSurfaceRef',
    'surfaceBindingGeneration',
    'surfaceBindingExpiresAt'
  )
end

local currentOwnerKind = redis.call(
  'HGET',
  installationKey,
  'activeOwnerKind'
)
local currentOwnerRef = redis.call(
  'HGET',
  installationKey,
  'activeOwnerRef'
)

if currentOwnerKind == 'USER' and currentOwnerRef then
  local currentUserKey = userPrefix .. currentOwnerRef
  if currentUserKey ~= targetOwnerKey then
    redis.call('ZREM', currentUserKey, installationId)
  end
end

local currentBoundSurfaceRef = redis.call(
  'HGET',
  installationKey,
  'boundSurfaceRef'
)
local currentGeneration = redis.call(
  'HGET',
  installationKey,
  'surfaceBindingGeneration'
)

if currentBoundSurfaceRef and currentBoundSurfaceRef ~= expectedSurfaceRef then
  local previousSurfaceKey = surfacePrefix .. currentBoundSurfaceRef
  local previousInstallation = redis.call(
    'HGET',
    previousSurfaceKey,
    'boundInstallationId'
  )
  local previousGeneration = redis.call(
    'HGET',
    previousSurfaceKey,
    'bindingGeneration'
  )

  if
    previousInstallation == installationId and
    previousGeneration == currentGeneration
  then
    redis.call(
      'HDEL',
      previousSurfaceKey,
      'boundInstallationId',
      'bindingGeneration'
    )
  end
end

if
  principalKind == 'anonymous' and
  not linkedAnonymousOwnerRef
then
  linkedAnonymousOwnerRef = principalRef
  redis.call(
    'HSET',
    installationKey,
    'linkedAnonymousOwnerRef',
    linkedAnonymousOwnerRef
  )
end

local generation = redis.call('INCR', generationKey)
local generationText = tostring(generation)

redis.call(
  'HSET',
  surfaceKey,
  'boundInstallationId', installationId,
  'bindingGeneration', generationText,
  'updatedAt', tostring(nowMs)
)

redis.call(
  'HSET',
  installationKey,
  'boundSurfaceRef', expectedSurfaceRef,
  'surfaceBindingGeneration', generationText,
  'surfaceBindingExpiresAt', tostring(handoffSurfaceExpiry),
  'ownerLinkedAt', tostring(nowMs),
  'updatedAt', tostring(nowMs)
)

if linkedAnonymousOwnerRef then
  redis.call(
    'ZADD',
    anonymousPrefix .. linkedAnonymousOwnerRef,
    credentialExpiresAt,
    installationId
  )
end

if principalKind == 'authenticated' then
  redis.call(
    'HSET',
    installationKey,
    'activeOwnerKind', 'USER',
    'activeOwnerRef', principalRef,
    'ownerAssociationExpiresAt', tostring(targetOwnerScore)
  )
  redis.call(
    'ZADD',
    targetOwnerKey,
    targetOwnerScore,
    installationId
  )
else
  local anonymousOwnerRef = linkedAnonymousOwnerRef or principalRef
  redis.call(
    'HSET',
    installationKey,
    'activeOwnerKind', 'ANONYMOUS_INSTALLATION',
    'activeOwnerRef', anonymousOwnerRef,
    'ownerAssociationExpiresAt', tostring(credentialExpiresAt)
  )
  redis.call(
    'ZADD',
    anonymousPrefix .. anonymousOwnerRef,
    credentialExpiresAt,
    installationId
  )
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
  return createHash('sha256')
    .update(value, 'utf8')
    .digest('hex')
}

function handoffKey(code: string): string {
  return `${HANDOFF_KEY_PREFIX}${sha256Hex(code)}`
}

function surfaceKey(surfaceRef: string): string {
  return `${SURFACE_KEY_PREFIX}${surfaceRef}`
}

export type NativeHandoffPrincipal = {
  kind: 'authenticated' | 'anonymous'
  ref: string
}

export type NativeHandoffSurface = {
  surfaceRef: string
  surfaceBindingExpiresAt: number
}

export async function createNativeHandoff(
  principal: NativeHandoffPrincipal,
  surface: NativeHandoffSurface,
): Promise<{ launchCode: string }> {
  const nowMs = Date.now()

  for (
    let attempt = 0;
    attempt < HANDOFF_CODE_ATTEMPTS;
    attempt += 1
  ) {
    const code = randomBytes(HANDOFF_CODE_BYTES)
      .toString('base64url')

    const result = await redis.eval(
      CREATE_HANDOFF_SCRIPT,
      1,
      handoffKey(code),
      principal.kind,
      principal.ref,
      surface.surfaceRef,
      String(surface.surfaceBindingExpiresAt),
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
  | 'SURFACE_INVALID'
  | 'SURFACE_EXPIRED'
  | 'OWNER_DEVICE_LIMIT_REACHED'

export async function redeemNativeHandoff(
  code: string,
  installationId: string,
  installationCredential: string,
): Promise<RedeemNativeHandoffResult> {
  if (
    !(await verifyInstallationCredential(
      installationId,
      installationCredential,
    ))
  ) {
    return 'AUTH_FAILED'
  }

  const verification =
    getNativeInstallationCredentialVerificationInput(
      installationId,
      installationCredential,
    )

  const surfaceRef = await redis.hget(
    handoffKey(code),
    'surfaceRef',
  )

  if (!surfaceRef) {
    return 'HANDOFF_NOT_FOUND'
  }

  const nowMs = Date.now()

  const result = await redis.eval(
    REDEEM_HANDOFF_SCRIPT,
    4,
    verification.installationKey,
    handoffKey(code),
    surfaceKey(surfaceRef),
    SURFACE_GENERATION_KEY,
    verification.credentialHash,
    String(nowMs),
    installationId,
    surfaceRef,
    OWNER_USER_KEY_PREFIX,
    OWNER_ANONYMOUS_KEY_PREFIX,
    INSTALLATION_KEY_PREFIX,
    SURFACE_KEY_PREFIX,
    String(NATIVE_OWNER_DEVICE_CAP),
  )

  if (
    result === 'LINKED_ANONYMOUS' ||
    result === 'LINKED_USER' ||
    result === 'AUTH_FAILED' ||
    result === 'HANDOFF_NOT_FOUND' ||
    result === 'HANDOFF_INVALID' ||
    result === 'SURFACE_INVALID' ||
    result === 'SURFACE_EXPIRED' ||
    result === 'OWNER_DEVICE_LIMIT_REACHED'
  ) {
    return result
  }

  throw new Error('NATIVE_HANDOFF_REDEEM_FAILED')
}

export type NativeHandoffRateLimitKind =
  | 'create'
  | 'redeem'

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
