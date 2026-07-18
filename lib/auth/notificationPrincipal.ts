// lib/auth/notificationPrincipal.ts

import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from 'crypto'
import { cookies } from 'next/headers'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export type NotificationPrincipal =
  | {
      kind: 'authenticated'
      userId: string
      email?: string
      isAdmin: boolean
    }
  | {
      kind: 'anonymous'
      userId: string
    }

type AnonymousPrincipalPayload = {
  version: 1
  userId: string
  issuedAt: number
  expiresAt: number
}

const ANONYMOUS_COOKIE_NAME =
  'notification_anonymous_principal'

const ANONYMOUS_COOKIE_TTL_SECONDS =
  60 * 60 * 24 * 365

const ANONYMOUS_PRINCIPAL_VERSION = 1

function getPrincipalSecret(): string {
  const secret =
    process.env.NOTIFICATION_PRINCIPAL_SECRET

  if (!secret || secret.length < 32) {
    throw new Error(
      '[NOTIFICATION_PRINCIPAL] NOTIFICATION_PRINCIPAL_SECRET must be at least 32 characters',
    )
  }

  return secret
}

function base64UrlEncode(
  input: Buffer | string,
): string {
  return Buffer.from(input)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input
    .replaceAll('-', '+')
    .replaceAll('_', '/')

  const padded =
    normalized +
    '='.repeat(
      (4 - (normalized.length % 4)) % 4,
    )

  return Buffer.from(padded, 'base64')
}

function signPayload(
  encodedPayload: string,
  secret: string,
): string {
  return base64UrlEncode(
    createHmac('sha256', secret)
      .update(encodedPayload)
      .digest(),
  )
}

function createAnonymousToken(
  payload: AnonymousPrincipalPayload,
  secret: string,
): string {
  const encodedPayload = base64UrlEncode(
    JSON.stringify(payload),
  )

  const signature = signPayload(
    encodedPayload,
    secret,
  )

  return `${encodedPayload}.${signature}`
}

function parseAnonymousToken(
  token: string,
  secret: string,
): AnonymousPrincipalPayload | null {
  const parts = token.split('.')

  if (parts.length !== 2) {
    return null
  }

  const [encodedPayload, signature] = parts

  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = signPayload(
    encodedPayload,
    secret,
  )

  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(
    expectedSignature,
  )

  if (
    actualBuffer.length !==
      expectedBuffer.length ||
    !timingSafeEqual(
      actualBuffer,
      expectedBuffer,
    )
  ) {
    return null
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(
        encodedPayload,
      ).toString('utf8'),
    ) as Partial<AnonymousPrincipalPayload>

    const now = Math.floor(Date.now() / 1000)

    if (
      payload.version !==
        ANONYMOUS_PRINCIPAL_VERSION ||
      typeof payload.userId !== 'string' ||
      !/^anon:[0-9a-f-]{36}$/i.test(
        payload.userId,
      ) ||
      typeof payload.issuedAt !== 'number' ||
      !Number.isInteger(payload.issuedAt) ||
      typeof payload.expiresAt !== 'number' ||
      !Number.isInteger(payload.expiresAt) ||
      payload.issuedAt > now + 300 ||
      payload.expiresAt <= now
    ) {
      return null
    }

    return payload as AnonymousPrincipalPayload
  } catch {
    return null
  }
}

export async function resolveNotificationPrincipal(): Promise<NotificationPrincipal> {
  const currentUser = await getCurrentUser()

  if (currentUser) {
    return {
      kind: 'authenticated',
      userId: currentUser.id,
      ...(currentUser.email
        ? { email: currentUser.email }
        : {}),
      isAdmin: currentUser.isAdmin === true,
    }
  }

  const secret = getPrincipalSecret()
  const cookieStore = await cookies()

  const existingToken =
    cookieStore.get(
      ANONYMOUS_COOKIE_NAME,
    )?.value

  if (existingToken) {
    const existingPayload =
      parseAnonymousToken(
        existingToken,
        secret,
      )

    if (existingPayload) {
      return {
        kind: 'anonymous',
        userId: existingPayload.userId,
      }
    }
  }

  const now = Math.floor(Date.now() / 1000)

  const payload: AnonymousPrincipalPayload = {
    version: ANONYMOUS_PRINCIPAL_VERSION,
    userId: `anon:${randomUUID()}`,
    issuedAt: now,
    expiresAt:
      now + ANONYMOUS_COOKIE_TTL_SECONDS,
  }

  const token = createAnonymousToken(
    payload,
    secret,
  )

  cookieStore.set(
    ANONYMOUS_COOKIE_NAME,
    token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        'production',
      sameSite: 'lax',
      path: '/',
      maxAge:
        ANONYMOUS_COOKIE_TTL_SECONDS,
    },
  )

  return {
    kind: 'anonymous',
    userId: payload.userId,
  }
}
