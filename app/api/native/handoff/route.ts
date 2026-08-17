// app/api/native/handoff/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'
import {
  HANDOFF_CREATE_RATE_LIMIT_MAX,
  HANDOFF_CREATE_RATE_LIMIT_WINDOW_SECONDS,
  checkNativeHandoffRateLimit,
  createNativeHandoff,
} from '@/lib/native/nativeHandoffStore'
import {
  NATIVE_SURFACE_COOKIE_NAME,
  getValidatedNativeSurface,
} from '@/lib/native/nativeSurfaceStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 256
const ANDROID_PACKAGE = 'com.thewhalesbtc.app'
const FALLBACK_URL = 'https://www.thewhalesbtc.com/ko/alerts'

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

function trustedClientKey(
  req: NextRequest,
): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = req.headers.get('x-real-ip')?.trim()
  return realIp || null
}

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false

  let parsedOrigin: URL
  try {
    parsedOrigin = new URL(origin)
  } catch {
    return false
  }

  if (parsedOrigin.origin !== req.nextUrl.origin) {
    return false
  }

  const fetchSite = req.headers.get('sec-fetch-site')
  return !fetchSite || fetchSite === 'same-origin'
}

function buildLaunchUrl(code: string): string {
  const encodedCode = encodeURIComponent(code)
  const encodedFallback = encodeURIComponent(FALLBACK_URL)

  return (
    `intent://native/handoff?code=${encodedCode}` +
    `#Intent;scheme=thewhales;package=${ANDROID_PACKAGE};` +
    `S.browser_fallback_url=${encodedFallback};end`
  )
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return json(
        { ok: false, error: 'SAME_ORIGIN_REQUIRED' },
        403,
      )
    }

    const contentLength = Number(
      req.headers.get('content-length') ?? '',
    )

    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_BODY_BYTES
    ) {
      return json(
        { ok: false, error: 'REQUEST_TOO_LARGE' },
        413,
      )
    }

    const raw = await req.text()
    if (
      Buffer.byteLength(raw, 'utf8') >
      MAX_BODY_BYTES
    ) {
      return json(
        { ok: false, error: 'REQUEST_TOO_LARGE' },
        413,
      )
    }

    if (raw.trim()) {
      let body: unknown
      try {
        body = JSON.parse(raw)
      } catch {
        return json(
          { ok: false, error: 'INVALID_JSON' },
          400,
        )
      }

      if (
        !isPlainObject(body) ||
        Object.keys(body).length !== 0
      ) {
        return json(
          { ok: false, error: 'INVALID_REQUEST' },
          400,
        )
      }
    }

    const clientKey = trustedClientKey(req)
    if (!clientKey) {
      return json(
        { ok: false, error: 'CLIENT_KEY_UNAVAILABLE' },
        400,
      )
    }

    const rate = await checkNativeHandoffRateLimit(
      'create',
      clientKey,
    )

    if (!rate.allowed) {
      return json(
        {
          ok: false,
          error: 'RATE_LIMITED',
          limit: HANDOFF_CREATE_RATE_LIMIT_MAX,
          windowSeconds:
            HANDOFF_CREATE_RATE_LIMIT_WINDOW_SECONDS,
        },
        429,
      )
    }

    const cookieStore = await cookies()
    const surface = await getValidatedNativeSurface(
      cookieStore.get(NATIVE_SURFACE_COOKIE_NAME)?.value,
    )

    if (!surface) {
      return json(
        { ok: false, error: 'NATIVE_SURFACE_REQUIRED' },
        409,
      )
    }

    const principal = await resolveNotificationPrincipal()
    const result = await createNativeHandoff(
      {
        kind: principal.kind,
        ref: principal.userId,
      },
      surface,
    )

    return json({
      ok: true,
      launchUrl: buildLaunchUrl(result.launchCode),
    })
  } catch {
    return json(
      { ok: false, error: 'HANDOFF_CREATE_FAILED' },
      500,
    )
  }
}
