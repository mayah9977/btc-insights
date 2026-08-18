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

const LOGOUT_NATIVE_SURFACE_SCRIPT = `
local sessionKey = KEYS[1]
local oldSurfaceKey = KEYS[2]
local newSurfaceKey = KEYS[3]
local generationKey = KEYS[4]

local nowMs = tonumber(ARGV[1])
local oldSurfaceRef = ARGV[2]
local newSurfaceRef = ARGV[3]
local installationPrefix = ARGV[4]
local userPrefix = ARGV[5]
local anonymousPrefix = ARGV[6]
local cap = tonumber(ARGV[7])
local newSurfaceExpiresAt = tonumber(ARGV[8])
local newSurfaceTtlMs = tonumber(ARGV[9])

if
  not nowMs or
  not cap or
  not newSurfaceExpiresAt or
  newSurfaceExpiresAt <= nowMs or
  not newSurfaceTtlMs or
  newSurfaceTtlMs <= 0
then
  return 'BOUND_FAIL_INPUT'
end

local oldBoundInstallationId = redis.call(
  'HGET',
  oldSurfaceKey,
  'boundInstallationId'
)
local oldBindingGeneration = redis.call(
  'HGET',
  oldSurfaceKey,
  'bindingGeneration'
)
local oldRevokedAt = redis.call(
  'HGET',
  oldSurfaceKey,
  'revokedAt'
)

local hasInstallationBinding =
  oldBoundInstallationId ~= false and
  oldBoundInstallationId ~= nil
local hasGenerationBinding =
  oldBindingGeneration ~= false and
  oldBindingGeneration ~= nil

if not hasInstallationBinding and not hasGenerationBinding then
  redis.call('DEL', sessionKey)
  return 'LOGGED_OUT_UNBOUND'
end

if
  not hasInstallationBinding or
  not hasGenerationBinding
then
  return 'BOUND_FAIL_SURFACE_FIELDS_MISSING'
end

if oldRevokedAt then
  return 'BOUND_FAIL_SURFACE_REVOKED'
end

local oldSurfaceTtlMs = redis.call(
  'PTTL',
  oldSurfaceKey
)

if not oldSurfaceTtlMs or oldSurfaceTtlMs <= 0 then
  return 'BOUND_FAIL_SURFACE_TTL'
end

local oldSurfaceExpiresAt = tonumber(
  redis.call(
    'HGET',
    oldSurfaceKey,
    'expiresAt'
  ) or ''
)

if
  not oldSurfaceExpiresAt or
  oldSurfaceExpiresAt <= nowMs
then
  return 'BOUND_FAIL_SURFACE_EXPIRED'
end

local rawSession = redis.call(
  'GET',
  sessionKey
)

if not rawSession then
  return 'BOUND_FAIL_SESSION_MISSING'
end

local sessionOk, sessionValue = pcall(
  cjson.decode,
  rawSession
)

if
  not sessionOk or
  type(sessionValue) ~= 'table'
then
  return 'BOUND_FAIL_SESSION_JSON'
end

if
  type(sessionValue.userId) ~= 'string' or
  sessionValue.userId == ''
then
  return 'BOUND_FAIL_SESSION_USER'
end

local sessionUserId = sessionValue.userId

if redis.call('EXISTS', newSurfaceKey) == 1 then
  return 'NEW_SURFACE_CONFLICT'
end

local installationKey =
  installationPrefix .. oldBoundInstallationId

if redis.call('EXISTS', installationKey) ~= 1 then
  return 'BOUND_FAIL_INSTALLATION_MISSING'
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

if installationBoundSurfaceRef ~= oldSurfaceRef then
  return 'BOUND_FAIL_REVERSE_SURFACE'
end

if installationGeneration ~= oldBindingGeneration then
  return 'BOUND_FAIL_GENERATION'
end

local credentialHash = redis.call(
  'HGET',
  installationKey,
  'credentialHash'
)
local credentialExpiresAt = tonumber(
  redis.call(
    'HGET',
    installationKey,
    'credentialExpiresAt'
  ) or ''
)
local surfaceBindingExpiresAt = tonumber(
  redis.call(
    'HGET',
    installationKey,
    'surfaceBindingExpiresAt'
  ) or ''
)

if not credentialHash or not credentialExpiresAt then
  return 'BOUND_FAIL_CREDENTIAL'
end

if credentialExpiresAt <= nowMs then
  return 'BOUND_FAIL_CREDENTIAL_EXPIRED'
end

if
  not surfaceBindingExpiresAt or
  surfaceBindingExpiresAt <= nowMs
then
  return 'BOUND_FAIL_BINDING_LEASE'
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
local linkedAnonymousOwnerRef = redis.call(
  'HGET',
  installationKey,
  'linkedAnonymousOwnerRef'
)

if activeOwnerKind == 'USER' then
  if activeOwnerRef ~= sessionUserId then
    return 'BOUND_FAIL_ACTIVE_OWNER_REF'
  end
elseif activeOwnerKind == 'ANONYMOUS_INSTALLATION' then
  if
    not activeOwnerRef or
    not linkedAnonymousOwnerRef or
    activeOwnerRef ~= linkedAnonymousOwnerRef
  then
    return 'BOUND_FAIL_ACTIVE_OWNER_REF'
  end
elseif activeOwnerKind == 'UNASSOCIATED' then
  if activeOwnerRef or linkedAnonymousOwnerRef then
    return 'BOUND_FAIL_ACTIVE_OWNER_REF'
  end
else
  return 'BOUND_FAIL_ACTIVE_OWNER_KIND'
end

if activeOwnerKind == 'USER' then
  if linkedAnonymousOwnerRef then
    local anonymousOwnerKey =
      anonymousPrefix .. linkedAnonymousOwnerRef

    redis.call(
      'ZREMRANGEBYSCORE',
      anonymousOwnerKey,
      '-inf',
      nowMs
    )

    local existingAnonymousMember = redis.call(
      'ZSCORE',
      anonymousOwnerKey,
      oldBoundInstallationId
    )

    if not existingAnonymousMember then
      local anonymousCount = redis.call(
        'ZCARD',
        anonymousOwnerKey
      )

      if anonymousCount >= cap then
        return 'OWNER_DEVICE_LIMIT_REACHED'
      end
    end
  end

  redis.call(
    'ZREM',
    userPrefix .. sessionUserId,
    oldBoundInstallationId
  )

  if linkedAnonymousOwnerRef then
    redis.call(
      'ZADD',
      anonymousPrefix .. linkedAnonymousOwnerRef,
      credentialExpiresAt,
      oldBoundInstallationId
    )
    redis.call(
      'HSET',
      installationKey,
      'activeOwnerKind', 'ANONYMOUS_INSTALLATION',
      'activeOwnerRef', linkedAnonymousOwnerRef,
      'ownerAssociationExpiresAt', tostring(credentialExpiresAt),
      'ownerLinkedAt', tostring(nowMs),
      'updatedAt', tostring(nowMs)
    )
  else
    redis.call(
      'HSET',
      installationKey,
      'activeOwnerKind', 'UNASSOCIATED',
      'updatedAt', tostring(nowMs)
    )
    redis.call(
      'HDEL',
      installationKey,
      'activeOwnerRef',
      'ownerAssociationExpiresAt',
      'ownerLinkedAt'
    )
  end
end

local newGeneration = redis.call(
  'INCR',
  generationKey
)
local newGenerationText =
  tostring(newGeneration)

redis.call(
  'HSET',
  newSurfaceKey,
  'createdAt', tostring(nowMs),
  'updatedAt', tostring(nowMs),
  'expiresAt', tostring(newSurfaceExpiresAt),
  'boundInstallationId', oldBoundInstallationId,
  'bindingGeneration', newGenerationText
)
redis.call(
  'PEXPIRE',
  newSurfaceKey,
  newSurfaceTtlMs
)

redis.call(
  'HSET',
  installationKey,
  'boundSurfaceRef', newSurfaceRef,
  'surfaceBindingGeneration', newGenerationText,
  'surfaceBindingExpiresAt', tostring(newSurfaceExpiresAt),
  'updatedAt', tostring(nowMs)
)

redis.call(
  'HDEL',
  oldSurfaceKey,
  'boundInstallationId',
  'bindingGeneration'
)
redis.call(
  'HSET',
  oldSurfaceKey,
  'revokedAt', tostring(nowMs),
  'updatedAt', tostring(nowMs)
)
redis.call(
  'PEXPIRE',
  oldSurfaceKey,
  oldSurfaceTtlMs
)

redis.call('DEL', sessionKey)

return 'LOGGED_OUT_ROTATED'
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

export type NativeLogoutBoundFailureResult =
  | 'BOUND_FAIL_INPUT'
  | 'BOUND_FAIL_SURFACE_FIELDS_MISSING'
  | 'BOUND_FAIL_SURFACE_REVOKED'
  | 'BOUND_FAIL_SURFACE_TTL'
  | 'BOUND_FAIL_SURFACE_EXPIRED'
  | 'BOUND_FAIL_SESSION_MISSING'
  | 'BOUND_FAIL_SESSION_JSON'
  | 'BOUND_FAIL_SESSION_USER'
  | 'BOUND_FAIL_INSTALLATION_MISSING'
  | 'BOUND_FAIL_REVERSE_SURFACE'
  | 'BOUND_FAIL_GENERATION'
  | 'BOUND_FAIL_CREDENTIAL'
  | 'BOUND_FAIL_CREDENTIAL_EXPIRED'
  | 'BOUND_FAIL_BINDING_LEASE'
  | 'BOUND_FAIL_ACTIVE_OWNER_KIND'
  | 'BOUND_FAIL_ACTIVE_OWNER_REF'

export type NativeLogoutResult =
  | 'LOGGED_OUT_UNBOUND'
  | 'LOGGED_OUT_ROTATED'
  | NativeLogoutBoundFailureResult
  | 'OWNER_DEVICE_LIMIT_REACHED'
  | 'NEW_SURFACE_CONFLICT'

export type NativeLogoutRotationInput = {
  sessionId: string | null
  oldSurfaceRef: string
  newSurfaceRef: string
  newSurfaceExpiresAt: number
  newSurfaceTtlSeconds: number
}

function sessionKey(
  sessionId: string | null,
): string {
  return `session:${sessionId ?? ''}`
}

export async function logoutWebSessionOnly(
  sessionId: string | null,
): Promise<'LOGGED_OUT_UNBOUND'> {
  if (sessionId) {
    await redis.del(sessionKey(sessionId))
  }

  return 'LOGGED_OUT_UNBOUND'
}

function isNativeLogoutBoundFailureResult(
  result: unknown,
): result is NativeLogoutBoundFailureResult {
  return (
    result === 'BOUND_FAIL_INPUT' ||
    result === 'BOUND_FAIL_SURFACE_FIELDS_MISSING' ||
    result === 'BOUND_FAIL_SURFACE_REVOKED' ||
    result === 'BOUND_FAIL_SURFACE_TTL' ||
    result === 'BOUND_FAIL_SURFACE_EXPIRED' ||
    result === 'BOUND_FAIL_SESSION_MISSING' ||
    result === 'BOUND_FAIL_SESSION_JSON' ||
    result === 'BOUND_FAIL_SESSION_USER' ||
    result === 'BOUND_FAIL_INSTALLATION_MISSING' ||
    result === 'BOUND_FAIL_REVERSE_SURFACE' ||
    result === 'BOUND_FAIL_GENERATION' ||
    result === 'BOUND_FAIL_CREDENTIAL' ||
    result === 'BOUND_FAIL_CREDENTIAL_EXPIRED' ||
    result === 'BOUND_FAIL_BINDING_LEASE' ||
    result === 'BOUND_FAIL_ACTIVE_OWNER_KIND' ||
    result === 'BOUND_FAIL_ACTIVE_OWNER_REF'
  )
}

export async function logoutNativeSurfaceSession({
  sessionId,
  oldSurfaceRef,
  newSurfaceRef,
  newSurfaceExpiresAt,
  newSurfaceTtlSeconds,
}: NativeLogoutRotationInput): Promise<NativeLogoutResult> {
  const nowMs = Date.now()

  const result = await redis.eval(
    LOGOUT_NATIVE_SURFACE_SCRIPT,
    4,
    sessionKey(sessionId),
    surfaceKey(oldSurfaceRef),
    surfaceKey(newSurfaceRef),
    SURFACE_GENERATION_KEY,
    String(nowMs),
    oldSurfaceRef,
    newSurfaceRef,
    INSTALLATION_KEY_PREFIX,
    OWNER_USER_KEY_PREFIX,
    OWNER_ANONYMOUS_KEY_PREFIX,
    String(NATIVE_OWNER_DEVICE_CAP),
    String(newSurfaceExpiresAt),
    String(newSurfaceTtlSeconds * 1000),
  )

  if (
    result === 'LOGGED_OUT_UNBOUND' ||
    result === 'LOGGED_OUT_ROTATED' ||
    isNativeLogoutBoundFailureResult(result) ||
    result === 'OWNER_DEVICE_LIMIT_REACHED' ||
    result === 'NEW_SURFACE_CONFLICT'
  ) {
    return result
  }

  throw new Error('NATIVE_LOGOUT_FAILED')
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
