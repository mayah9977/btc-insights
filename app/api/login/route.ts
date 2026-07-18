// app/api/login/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { redis } from '@/lib/redis/index'
import { adminAuth } from '@/lib/firebase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type DeviceType = 'desktop' | 'mobile'

const SESSION_COOKIE_NAME = 'session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const SESSION_AUTH_VERSION = 2

const ADMIN_EMAILS = Array.from(
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

function isAdminEmail(email?: string) {
  if (!email) return false

  return ADMIN_EMAILS.includes(
    email.trim().toLowerCase(),
  )
}

function getDeviceType(
  req: NextRequest,
  value?: unknown,
): DeviceType {
  if (
    value === 'mobile' ||
    value === 'desktop'
  ) {
    return value
  }

  const userAgent =
    req.headers.get('user-agent') ?? ''

  if (
    /mobile|iphone|ipod|android.*mobile|blackberry|windows phone/i.test(
      userAgent,
    )
  ) {
    return 'mobile'
  }

  return 'desktop'
}

function getSessionKey(sessionId: string) {
  return `session:${sessionId}`
}

function getUserDeviceSessionKey(
  userId: string,
  deviceType: DeviceType,
) {
  return `user:sessions:${userId}:${deviceType}`
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  const idToken =
    typeof body?.idToken === 'string'
      ? body.idToken.trim()
      : ''

  if (!idToken) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ID_TOKEN_REQUIRED',
      },
      {
        status: 400,
      },
    )
  }

  let decodedToken

  try {
    decodedToken =
      await adminAuth.verifyIdToken(
        idToken,
        true,
      )
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_ID_TOKEN',
      },
      {
        status: 401,
      },
    )
  }

  const userId = decodedToken.uid.trim()
  const email =
    typeof decodedToken.email === 'string'
      ? decodedToken.email
          .trim()
          .toLowerCase()
      : undefined

  const emailVerified =
    decodedToken.email_verified === true

  if (!userId) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_IDENTITY',
      },
      {
        status: 401,
      },
    )
  }

  const deviceType = getDeviceType(
    req,
    body?.deviceType,
  )

  const isAdmin =
    emailVerified &&
    isAdminEmail(email)

  const sessionId = randomUUID()
  const sessionKey =
    getSessionKey(sessionId)

  const userDeviceSessionKey =
    getUserDeviceSessionKey(
      userId,
      deviceType,
    )

  try {
    const previousSessionId =
      await redis.get(
        userDeviceSessionKey,
      )

    if (previousSessionId) {
      const prevId =
        typeof previousSessionId ===
        'string'
          ? previousSessionId
          : String(previousSessionId)

      if (
        prevId &&
        prevId !== sessionId
      ) {
        await redis.del(
          getSessionKey(prevId),
        )
      }
    }

    const now = Date.now()

    await redis.set(
      sessionKey,
      JSON.stringify({
        id: sessionId,
        userId,
        email,
        emailVerified,
        isAdmin,
        isVIP: isAdmin,
        role: isAdmin
          ? 'ADMIN'
          : 'USER',
        deviceType,
        authVersion:
          SESSION_AUTH_VERSION,
        authProvider: 'firebase',
        createdAt: now,
        updatedAt: now,
      }),
      'EX',
      SESSION_TTL_SECONDS,
    )

    await redis.set(
      userDeviceSessionKey,
      sessionId,
      'EX',
      SESSION_TTL_SECONDS,
    )

    const res = NextResponse.json({
      ok: true,
      user: {
        id: userId,
        email,
        emailVerified,
        isAdmin,
        isVIP: isAdmin,
        role: isAdmin
          ? 'ADMIN'
          : 'USER',
        deviceType,
      },
    })

    res.cookies.set(
      SESSION_COOKIE_NAME,
      sessionId,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          'production',
        sameSite: 'lax',
        path: '/',
        maxAge:
          SESSION_TTL_SECONDS,
      },
    )

    res.cookies.set('userId', '', {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return res
  } catch (error) {
    console.error(
      '[API_LOGIN][SESSION_CREATE_FAILED]',
      error instanceof Error
        ? error.message
        : 'Unknown error',
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          'SESSION_CREATE_FAILED',
      },
      {
        status: 500,
      },
    )
  }
}
