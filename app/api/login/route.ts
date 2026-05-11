// app/api/login/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { redis } from '@/lib/redis/index'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type DeviceType = 'desktop' | 'mobile'

const SESSION_COOKIE_NAME = 'session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

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
  try {
    console.log('[API_LOGIN] request start')

    const body = await req.json()

    console.log('[API_LOGIN] request body', {
      userId: body?.userId,
      email: body?.email,
      deviceType: body?.deviceType,
    })

    const userId =
      typeof body.userId === 'string'
        ? body.userId.trim()
        : typeof body.id === 'string'
          ? body.id.trim()
          : ''

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : undefined

    const deviceType = getDeviceType(
      req,
      body.deviceType,
    )

    if (!userId) {
      console.error('[API_LOGIN] missing userId')

      return NextResponse.json(
        {
          ok: false,
          message: 'userId가 필요합니다.',
        },
        {
          status: 400,
        },
      )
    }

    const isAdmin = isAdminEmail(email)

    const sessionId = randomUUID()

    console.log('[API_LOGIN] creating session', {
      sessionId,
      userId,
      email,
      deviceType,
      isAdmin,
    })

    const sessionKey =
      getSessionKey(sessionId)

    const userDeviceSessionKey =
      getUserDeviceSessionKey(
        userId,
        deviceType,
      )

    const previousSessionId =
      await redis.get(userDeviceSessionKey)

    if (previousSessionId) {
      const prevId =
        typeof previousSessionId === 'string'
          ? previousSessionId
          : String(previousSessionId)

      if (prevId && prevId !== sessionId) {
        console.log(
          '[API_LOGIN] deleting previous session',
          {
            prevId,
          },
        )

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
        isAdmin,
        isVIP: isAdmin,
        role: isAdmin ? 'ADMIN' : 'USER',
        deviceType,
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

    const redisVerify = await redis.get(
      sessionKey,
    )

    console.log('[API_LOGIN] redis verify', {
      exists: !!redisVerify,
    })

    const res = NextResponse.json({
      ok: true,
      user: {
        id: userId,
        email,
        isAdmin,
        isVIP: isAdmin,
        role: isAdmin ? 'ADMIN' : 'USER',
        deviceType,
      },
    })

    console.log(
      '[API_LOGIN] setting session cookie',
      {
        cookieName: SESSION_COOKIE_NAME,
        sessionId,
      },
    )

    /**
     * 🔥 localhost 대응
     */
    res.cookies.set(
      SESSION_COOKIE_NAME,
      sessionId,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV === 'production',

        sameSite: 'lax',

        path: '/',

        maxAge: SESSION_TTL_SECONDS,
      },
    )

    res.cookies.set('userId', '', {
      httpOnly: true,

      secure:
        process.env.NODE_ENV === 'production',

      sameSite: 'lax',

      path: '/',

      maxAge: 0,
    })

    console.log(
      '[API_LOGIN] response cookies',
      res.cookies.getAll(),
    )

    console.log('[API_LOGIN] success')

    return res
  } catch (error) {
    console.error('[API_LOGIN]', error)

    return NextResponse.json(
      {
        ok: false,
        message: '로그인 실패',
      },
      {
        status: 500,
      },
    )
  }
}
