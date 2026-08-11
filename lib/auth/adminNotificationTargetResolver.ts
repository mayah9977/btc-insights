// lib/auth/adminNotificationTargetResolver.ts

type AdminNotificationTargetResolution = {
  userIds: string[]
  configuredAdminUserIdCount: number
  configuredAdminEmailCount: number
  resolvedAdminEmailUidCount: number
  notFoundCount: number
  unverifiedCount: number
  disabledCount: number
  lookupFailureCount: number
  cacheHit: boolean
}

type CachedAdminNotificationTargetResolution = {
  configKey: string
  expiresAt: number
  result: Omit<AdminNotificationTargetResolution, 'cacheHit'>
}

const CACHE_TTL_MS = 5 * 60 * 1000

let cachedResolution: CachedAdminNotificationTargetResolution | null = null
let inFlightResolution:
  | Promise<AdminNotificationTargetResolution>
  | null = null
let inFlightConfigKey: string | null = null

function getConfiguredAdminUserIds(): string[] {
  return [
    ...new Set(
      (process.env.ADMIN_USER_IDS ?? '')
        .split(',')
        .map(userId => userId.trim())
        .filter(Boolean),
    ),
  ]
}

function getConfiguredAdminEmails(): string[] {
  return Array.from(
    new Set(
      (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .flatMap((value) => {
          const matches = value
            .trim()
            .toLowerCase()
            .match(
              /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g,
            )

          return matches ?? []
        })
        .filter(Boolean),
    ),
  )
}

function cloneResolution(
  result: Omit<AdminNotificationTargetResolution, 'cacheHit'>,
  cacheHit: boolean,
): AdminNotificationTargetResolution {
  return {
    ...result,
    userIds: [...result.userIds],
    cacheHit,
  }
}

function getFirebaseErrorCode(error: unknown): string | null {
  if (
    error !== null &&
    typeof error === 'object' &&
    'code' in error
  ) {
    const code = (
      error as { code?: unknown }
    ).code

    return typeof code === 'string'
      ? code
      : null
  }

  return null
}

async function refreshAdminNotificationTargets(
  adminUserIds: string[],
  adminEmails: string[],
  configKey: string,
): Promise<AdminNotificationTargetResolution> {
  const userIds = new Set(adminUserIds)

  let resolvedAdminEmailUidCount = 0
  let notFoundCount = 0
  let unverifiedCount = 0
  let disabledCount = 0
  let lookupFailureCount = 0

  if (adminEmails.length === 0) {
    const result = {
      userIds: [...userIds],
      configuredAdminUserIdCount:
        adminUserIds.length,
      configuredAdminEmailCount: 0,
      resolvedAdminEmailUidCount,
      notFoundCount,
      unverifiedCount,
      disabledCount,
      lookupFailureCount,
    }

    cachedResolution = {
      configKey,
      expiresAt: Date.now() + CACHE_TTL_MS,
      result,
    }

    return cloneResolution(result, false)
  }

  try {
    const firebaseAdminModule =
      await import('@/lib/firebase-admin')

    await Promise.all(
      adminEmails.map(async (email) => {
        try {
          const firebaseUser =
            await firebaseAdminModule.adminAuth.getUserByEmail(email)

          if (firebaseUser.emailVerified !== true) {
            unverifiedCount += 1
            return
          }

          if (firebaseUser.disabled === true) {
            disabledCount += 1
            return
          }

          userIds.add(firebaseUser.uid)
          resolvedAdminEmailUidCount += 1
        } catch (error: unknown) {
          if (
            getFirebaseErrorCode(error) ===
            'auth/user-not-found'
          ) {
            notFoundCount += 1
            return
          }

          lookupFailureCount += 1
        }
      }),
    )
  } catch {
    lookupFailureCount = adminEmails.length
  }

  const result = {
    userIds: [...userIds],
    configuredAdminUserIdCount:
      adminUserIds.length,
    configuredAdminEmailCount:
      adminEmails.length,
    resolvedAdminEmailUidCount,
    notFoundCount,
    unverifiedCount,
    disabledCount,
    lookupFailureCount,
  }

  if (lookupFailureCount === 0) {
    cachedResolution = {
      configKey,
      expiresAt: Date.now() + CACHE_TTL_MS,
      result,
    }
  } else {
    cachedResolution = null
  }

  return cloneResolution(result, false)
}

export async function resolveAdminNotificationTargetUserIds(): Promise<AdminNotificationTargetResolution> {
  const adminUserIds =
    getConfiguredAdminUserIds()
  const adminEmails =
    getConfiguredAdminEmails()
  const configKey = JSON.stringify([
    adminUserIds,
    adminEmails,
  ])
  const now = Date.now()

  if (
    cachedResolution &&
    cachedResolution.configKey === configKey &&
    cachedResolution.expiresAt > now
  ) {
    return cloneResolution(
      cachedResolution.result,
      true,
    )
  }

  if (
    inFlightResolution &&
    inFlightConfigKey === configKey
  ) {
    return inFlightResolution
  }

  const refreshPromise =
    refreshAdminNotificationTargets(
      adminUserIds,
      adminEmails,
      configKey,
    ).catch(() => ({
      userIds: [...adminUserIds],
      configuredAdminUserIdCount:
        adminUserIds.length,
      configuredAdminEmailCount:
        adminEmails.length,
      resolvedAdminEmailUidCount: 0,
      notFoundCount: 0,
      unverifiedCount: 0,
      disabledCount: 0,
      lookupFailureCount:
        adminEmails.length,
      cacheHit: false,
    }))

  inFlightResolution = refreshPromise
  inFlightConfigKey = configKey

  try {
    return await refreshPromise
  } finally {
    if (inFlightResolution === refreshPromise) {
      inFlightResolution = null
      inFlightConfigKey = null
    }
  }
}
