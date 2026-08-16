// app/api/native/installations/register/route.ts  

import { NextRequest, NextResponse } from 'next/server'

import {
  REGISTER_RATE_LIMIT_MAX,
  REGISTER_RATE_LIMIT_WINDOW_SECONDS,
  checkNativeRateLimit,
  createInstallationCredential,
} from '@/lib/native/nativeInstallationStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 1024
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

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

function trustedClientKey(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = req.headers.get('x-real-ip')?.trim()
  return realIp || null
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
): boolean {
  const keys = Object.keys(value)
  return keys.length === allowed.length && keys.every(key => allowed.includes(key))
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get('content-length') ?? '')
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return json({ ok: false, error: 'REQUEST_TOO_LARGE' }, 413)
    }

    const raw = await req.text()
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return json({ ok: false, error: 'REQUEST_TOO_LARGE' }, 413)
    }

    let body: unknown
    try {
      body = JSON.parse(raw)
    } catch {
      return json({ ok: false, error: 'INVALID_JSON' }, 400)
    }

    if (!isPlainObject(body) || !hasOnlyKeys(body, ['installationId'])) {
      return json({ ok: false, error: 'INVALID_REQUEST' }, 400)
    }

    const installationId = body.installationId
    if (
      typeof installationId !== 'string' ||
      installationId.length !== 36 ||
      !UUID_V4.test(installationId)
    ) {
      return json({ ok: false, error: 'INVALID_INSTALLATION_ID' }, 400)
    }

    const clientKey = trustedClientKey(req)
    if (!clientKey) {
      return json({ ok: false, error: 'CLIENT_KEY_UNAVAILABLE' }, 400)
    }

    const rate = await checkNativeRateLimit('register', clientKey)
    if (!rate.allowed) {
      return json(
        {
          ok: false,
          error: 'RATE_LIMITED',
          limit: REGISTER_RATE_LIMIT_MAX,
          windowSeconds: REGISTER_RATE_LIMIT_WINDOW_SECONDS,
        },
        429,
      )
    }

    const result = await createInstallationCredential(installationId)
    if (result.status === 'EXISTS') {
      return json({ ok: false, error: 'INSTALLATION_ALREADY_EXISTS' }, 409)
    }

    return json({ ok: true, installationCredential: result.credential }, 201)
  } catch {
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500)
  }
}
