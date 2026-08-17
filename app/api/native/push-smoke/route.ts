// app/api/native/push-smoke/route.ts

import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'
import { pushAlertTriggered } from '@/lib/push/pushOnAlert'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BODY_MAX_BYTES = 1024
const ONE_SHOT_TTL_SECONDS = 86_400
const ONE_SHOT_KEY_PREFIX = 'native:push-smoke:'
const ONE_SHOT_VALUE = 'claimed'

const DIAGNOSTIC_ALERT_ID = 'native-push-smoke'
const DIAGNOSTIC_SYMBOL = 'BTCUSDT'
const DIAGNOSTIC_PRICE = 100_000

function json(
  body: Record<string, unknown>,
  status: number,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) {
    return false
  }

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
  if (
    fetchSite !== null &&
    fetchSite.toLowerCase() !== 'same-origin'
  ) {
    return false
  }

  return true
}

function hasJsonContentType(req: NextRequest): boolean {
  const contentType = req.headers.get('content-type')
  if (!contentType) {
    return false
  }

  const mediaType = contentType
    .split(';', 1)[0]
    ?.trim()
    .toLowerCase()

  return mediaType === 'application/json'
}

function isExactEmptyPlainObject(value: unknown): boolean {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return false
  }

  return Object.keys(value).length === 0
}

function buildOneShotKey(userId: string): string {
  const adminHash = createHash('sha256')
    .update(userId, 'utf8')
    .digest('hex')

  return `${ONE_SHOT_KEY_PREFIX}${adminHash}`
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return json(
      {
        ok: false,
        status: 'FORBIDDEN',
      },
      403,
    )
  }

  if (!hasJsonContentType(req)) {
    return json(
      {
        ok: false,
        status: 'INVALID_REQUEST',
      },
      400,
    )
  }

  let rawBody: string

  try {
    rawBody = await req.text()
  } catch {
    return json(
      {
        ok: false,
        status: 'INVALID_REQUEST',
      },
      400,
    )
  }

  if (Buffer.byteLength(rawBody, 'utf8') > BODY_MAX_BYTES) {
    return json(
      {
        ok: false,
        status: 'INVALID_REQUEST',
      },
      400,
    )
  }

  let parsedBody: unknown

  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    return json(
      {
        ok: false,
        status: 'INVALID_REQUEST',
      },
      400,
    )
  }

  if (!isExactEmptyPlainObject(parsedBody)) {
    return json(
      {
        ok: false,
        status: 'INVALID_REQUEST',
      },
      400,
    )
  }

  let principal

  try {
    principal = await resolveNotificationPrincipal()
  } catch {
    return json(
      {
        ok: false,
        status: 'AUTHENTICATION_FAILED',
      },
      500,
    )
  }

  if (
    principal.kind !== 'authenticated' ||
    principal.isAdmin !== true
  ) {
    return json(
      {
        ok: false,
        status: 'FORBIDDEN',
      },
      403,
    )
  }

  const oneShotKey = buildOneShotKey(principal.userId)

  let claimResult: string | null

  try {
    claimResult = await redis.set(
      oneShotKey,
      ONE_SHOT_VALUE,
      'EX',
      ONE_SHOT_TTL_SECONDS,
      'NX',
    )
  } catch {
    return json(
      {
        ok: false,
        status: 'CLAIM_FAILED',
      },
      500,
    )
  }

  if (claimResult !== 'OK') {
    return json(
      {
        ok: false,
        status: 'ALREADY_CLAIMED',
      },
      409,
    )
  }

  try {
    await pushAlertTriggered({
      userId: principal.userId,
      alertId: DIAGNOSTIC_ALERT_ID,
      symbol: DIAGNOSTIC_SYMBOL,
      price: DIAGNOSTIC_PRICE,
      level: 'CRITICAL',
      ts: Date.now(),
    })
  } catch {
    return json(
      {
        ok: false,
        status: 'PROCESSING_FAILED',
      },
      500,
    )
  }

  return json(
    {
      ok: true,
      status: 'PROCESSED',
    },
    200,
  )
}
