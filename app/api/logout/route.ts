// app/api/logout/route.ts

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import {
  logoutNativeSurfaceSession,
  logoutWebSessionOnly,
  type NativeLogoutResult,
} from '@/lib/native/nativeHandoffStore'
import {
  NATIVE_SURFACE_COOKIE_NAME,
  NATIVE_SURFACE_ROTATION_ATTEMPTS,
  NATIVE_SURFACE_TTL_SECONDS,
  createNativeSurfaceRotationCandidate,
  getNativeSurfaceRefFromCredential,
} from '@/lib/native/nativeSurfaceStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(
  body: Record<string, unknown>,
  status = 200,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

function clearSessionCookie(res: NextResponse): void {
  res.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

function setRotatedSurfaceCookie(
  res: NextResponse,
  credential: string,
): void {
  res.cookies.set(
    NATIVE_SURFACE_COOKIE_NAME,
    credential,
    {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: NATIVE_SURFACE_TTL_SECONDS,
    },
  )
}

function assertNever(value: never): never {
  throw new Error('UNHANDLED_NATIVE_LOGOUT_RESULT')
}

function failureResponse(
  result: Exclude<
    NativeLogoutResult,
    'LOGGED_OUT_UNBOUND' | 'LOGGED_OUT_ROTATED'
  >,
): NextResponse {
  switch (result) {
    case 'BOUND_VERIFICATION_FAILED':
      return json(
        {
          ok: false,
          error: 'BOUND_LOGOUT_VERIFICATION_FAILED',
        },
        409,
      )

    case 'OWNER_DEVICE_LIMIT_REACHED':
      return json(
        {
          ok: false,
          error: 'OWNER_DEVICE_LIMIT_REACHED',
        },
        409,
      )

    case 'NEW_SURFACE_CONFLICT':
      return json(
        {
          ok: false,
          error: 'NATIVE_SURFACE_ROTATION_CONFLICT',
        },
        409,
      )

    default:
      return assertNever(result)
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionId =
      cookieStore.get('session')?.value ?? null
    const currentSurfaceCredential =
      cookieStore.get(NATIVE_SURFACE_COOKIE_NAME)?.value

    const oldSurfaceRef =
      getNativeSurfaceRefFromCredential(
        currentSurfaceCredential,
      )

    if (!oldSurfaceRef) {
      await logoutWebSessionOnly(sessionId)

      const res = json({ ok: true })
      clearSessionCookie(res)
      return res
    }

    for (
      let attempt = 0;
      attempt < NATIVE_SURFACE_ROTATION_ATTEMPTS;
      attempt += 1
    ) {
      const candidate =
        createNativeSurfaceRotationCandidate()

      const result = await logoutNativeSurfaceSession({
        sessionId,
        oldSurfaceRef,
        newSurfaceRef: candidate.surfaceRef,
        newSurfaceExpiresAt:
          candidate.surfaceBindingExpiresAt,
        newSurfaceTtlSeconds:
          NATIVE_SURFACE_TTL_SECONDS,
      })

      if (result === 'NEW_SURFACE_CONFLICT') {
        continue
      }

      if (result === 'LOGGED_OUT_UNBOUND') {
        const res = json({ ok: true })
        clearSessionCookie(res)
        return res
      }

      if (result === 'LOGGED_OUT_ROTATED') {
        const res = json({ ok: true })

        clearSessionCookie(res)
        setRotatedSurfaceCookie(
          res,
          candidate.credential,
        )

        return res
      }

      return failureResponse(result)
    }

    return failureResponse('NEW_SURFACE_CONFLICT')
  } catch {
    return json(
      { ok: false, message: '로그아웃 실패' },
      500,
    )
  }
}
