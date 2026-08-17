// app/api/native/handoff/redeem/route.ts

import { NextRequest, NextResponse } from 'next/server'

import {
  HANDOFF_REDEEM_RATE_LIMIT_MAX,
  HANDOFF_REDEEM_RATE_LIMIT_WINDOW_SECONDS,
  checkNativeHandoffRateLimit,
  redeemNativeHandoff,
  type RedeemNativeHandoffResult,
} from '@/lib/native/nativeHandoffStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 8192
const MAX_CREDENTIAL_BYTES = 512
const HANDOFF_CODE = /^[A-Za-z0-9_-]{43}$/
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

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === allowed.length &&
    keys.every(key => allowed.includes(key))
  )
}

function assertNever(value: never): never {
  throw new Error(`UNHANDLED_HANDOFF_RESULT_TYPE`)
}

function respondToRedeemResult(
  result: RedeemNativeHandoffResult,
): NextResponse {
  switch (result) {
    case 'LINKED_ANONYMOUS':
    case 'LINKED_USER':
      return json({ ok: true })

    case 'AUTH_FAILED':
      return json(
        {
          ok: false,
          error: 'INVALID_INSTALLATION_CREDENTIAL',
        },
        401,
      )

    case 'HANDOFF_NOT_FOUND':
    case 'HANDOFF_INVALID':
      return json(
        {
          ok: false,
          error: 'HANDOFF_EXPIRED_OR_REPLAYED',
        },
        410,
      )

    case 'SURFACE_INVALID':
      return json(
        { ok: false, error: 'NATIVE_SURFACE_INVALID' },
        409,
      )

    case 'SURFACE_EXPIRED':
      return json(
        { ok: false, error: 'NATIVE_SURFACE_EXPIRED' },
        410,
      )

    case 'OWNER_DEVICE_LIMIT_REACHED':
      return json(
        {
          ok: false,
          error: 'OWNER_DEVICE_LIMIT_REACHED',
        },
        409,
      )

    default:
      return assertNever(result)
  }
}

export async function POST(req: NextRequest) {
  try {
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
      !hasOnlyKeys(body, [
        'code',
        'installationId',
        'installationCredential',
      ])
    ) {
      return json(
        { ok: false, error: 'INVALID_REQUEST' },
        400,
      )
    }

    const code = body.code
    const installationId = body.installationId
    const installationCredential =
      body.installationCredential

    if (
      typeof code !== 'string' ||
      !HANDOFF_CODE.test(code)
    ) {
      return json(
        { ok: false, error: 'INVALID_HANDOFF_CODE' },
        400,
      )
    }

    if (
      typeof installationId !== 'string' ||
      installationId.length !== 36 ||
      !UUID_V4.test(installationId)
    ) {
      return json(
        { ok: false, error: 'INVALID_INSTALLATION_ID' },
        400,
      )
    }

    if (
      typeof installationCredential !== 'string' ||
      !installationCredential ||
      Buffer.byteLength(
        installationCredential,
        'utf8',
      ) > MAX_CREDENTIAL_BYTES
    ) {
      return json(
        {
          ok: false,
          error: 'INVALID_INSTALLATION_CREDENTIAL',
        },
        400,
      )
    }

    const clientKey = trustedClientKey(req)
    if (!clientKey) {
      return json(
        { ok: false, error: 'CLIENT_KEY_UNAVAILABLE' },
        400,
      )
    }

    const rate = await checkNativeHandoffRateLimit(
      'redeem',
      clientKey,
    )

    if (!rate.allowed) {
      return json(
        {
          ok: false,
          error: 'RATE_LIMITED',
          limit: HANDOFF_REDEEM_RATE_LIMIT_MAX,
          windowSeconds:
            HANDOFF_REDEEM_RATE_LIMIT_WINDOW_SECONDS,
        },
        429,
      )
    }

    const result = await redeemNativeHandoff(
      code,
      installationId,
      installationCredential,
    )

    return respondToRedeemResult(result)
  } catch {
    return json(
      { ok: false, error: 'HANDOFF_REDEEM_FAILED' },
      500,
    )
  }
}
