//app/api/realtime/token/route.ts  

import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getUserVIPLevel } from '@/lib/vip/vipServer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RealtimeScope = 'vip'

type CurrentUserLike = {
  id?: string
  uid?: string
  userId?: string
  email?: string | null
}

type RealtimeTokenPayload = {
  sub: string
  email?: string
  scope: RealtimeScope
  level: 'VIP'
  iat: number
  exp: number
  nonce: string
}

const TOKEN_TTL_SECONDS = 60

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`[REALTIME_TOKEN] ${name} is not defined`)
  }

  return value
}

function base64UrlEncode(input: Buffer | string): string {
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
    '='.repeat((4 - (normalized.length % 4)) % 4)

  return Buffer.from(padded, 'base64')
}

function signValue(value: string, secret: string): string {
  return base64UrlEncode(
    createHmac('sha256', secret).update(value).digest(),
  )
}

function createRealtimeToken(
  payload: RealtimeTokenPayload,
  secret: string,
): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const encodedHeader = base64UrlEncode(
    JSON.stringify(header),
  )

  const encodedPayload = base64UrlEncode(
    JSON.stringify(payload),
  )

  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = signValue(signingInput, secret)

  return `${signingInput}.${signature}`
}

function verifySignedTokenShape(
  token: string,
  secret: string,
): RealtimeTokenPayload | null {
  const parts = token.split('.')

  if (parts.length !== 3) {
    return null
  }

  const [encodedHeader, encodedPayload, signature] = parts

  if (!encodedHeader || !encodedPayload || !signature) {
    return null
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = signValue(signingInput, secret)

  const actual = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)

  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    return null
  }

  try {
    return JSON.parse(
      base64UrlDecode(encodedPayload).toString('utf8'),
    ) as RealtimeTokenPayload
  } catch {
    return null
  }
}

function parseCsvEnv(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function parseEmailCsvEnv(name: string): string[] {
  return parseCsvEnv(name).map((value) =>
    value
      .replace(/[\[\]\(\)"]/g, '')
      .trim()
      .toLowerCase(),
  )
}

function getCurrentUserId(user: CurrentUserLike): string | null {
  return user.id ?? user.uid ?? user.userId ?? null
}

function getCurrentUserEmail(user: CurrentUserLike): string | null {
  return user.email?.trim().toLowerCase() ?? null
}

function isAdminOrTestUser(params: {
  userId: string
  email: string | null
}): boolean {
  const adminUserIds = parseCsvEnv('ADMIN_USER_IDS')
  const realtimeTestUserIds = parseCsvEnv(
    'REALTIME_VPS_TEST_USER_IDS',
  )

  const adminEmails = parseEmailCsvEnv('ADMIN_EMAILS')
  const realtimeTestEmails = parseEmailCsvEnv(
    'REALTIME_VPS_TEST_EMAILS',
  )

  if (
    adminUserIds.includes(params.userId) ||
    realtimeTestUserIds.includes(params.userId)
  ) {
    return true
  }

  if (
    params.email &&
    (adminEmails.includes(params.email) ||
      realtimeTestEmails.includes(params.email))
  ) {
    return true
  }

  return false
}

function getRealtimeVpsUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_REALTIME_VPS_URL ??
    process.env.REALTIME_VPS_URL ??
    'https://realtime.thewhalesbtc.com/stream'

  return url
}

export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get('scope')

    if (scope !== 'vip') {
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_SCOPE',
        },
        { status: 400 },
      )
    }

    const secret = getRequiredEnv('REALTIME_TOKEN_SECRET')

    const currentUser =
      (await getCurrentUser()) as CurrentUserLike | null

    if (!currentUser) {
      return NextResponse.json(
        {
          ok: false,
          error: 'UNAUTHENTICATED',
        },
        { status: 401 },
      )
    }

    const userId = getCurrentUserId(currentUser)
    const email = getCurrentUserEmail(currentUser)

    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'USER_ID_NOT_FOUND',
        },
        { status: 401 },
      )
    }

    const isAllowedTestUser = isAdminOrTestUser({
      userId,
      email,
    })

    if (!isAllowedTestUser) {
      return NextResponse.json(
        {
          ok: false,
          error: 'VPS_SSE_NOT_ENABLED_FOR_USER',
        },
        { status: 403 },
      )
    }

    const vipLevel = await getUserVIPLevel(userId)

    if (vipLevel !== 'VIP') {
      return NextResponse.json(
        {
          ok: false,
          error: 'VIP_REQUIRED',
        },
        { status: 403 },
      )
    }

    const now = Math.floor(Date.now() / 1000)

    const payload: RealtimeTokenPayload = {
      sub: userId,
      ...(email ? { email } : {}),
      scope: 'vip',
      level: 'VIP',
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
      nonce: randomBytes(16).toString('hex'),
    }

    const token = createRealtimeToken(payload, secret)

    const verifyCheck = verifySignedTokenShape(token, secret)

    if (!verifyCheck) {
      return NextResponse.json(
        {
          ok: false,
          error: 'TOKEN_SIGN_FAILED',
        },
        { status: 500 },
      )
    }

    const streamUrl = new URL(getRealtimeVpsUrl())
    streamUrl.searchParams.set('scope', 'vip')
    streamUrl.searchParams.set('token', token)

    return NextResponse.json(
      {
        ok: true,
        scope: 'vip',
        expiresIn: TOKEN_TTL_SECONDS,
        url: streamUrl.toString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    console.error('[REALTIME_TOKEN] failed', error)

    return NextResponse.json(
      {
        ok: false,
        error: 'REALTIME_TOKEN_FAILED',
      },
      { status: 500 },
    )
  }
}
