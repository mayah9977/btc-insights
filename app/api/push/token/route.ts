//app/api/push/token/route.ts

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import {
  claimUserPushToken,
  removeClaimedUserPushToken,
} from '@/lib/push/pushStore'
import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'

export async function POST(req: Request) {
  const body = await req.json()

  const token =
    typeof body.token === 'string'
      ? body.token.trim()
      : ''

  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'Missing token' },
      { status: 400 },
    )
  }

  const rawAction = body.action
  const action =
    rawAction == null
      ? 'register'
      : rawAction

  if (
    action !== 'register' &&
    action !== 'unregister'
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_ACTION',
      },
      {
        status: 400,
      },
    )
  }

  const principal =
    await resolveNotificationPrincipal()

  if (action === 'unregister') {
    await removeClaimedUserPushToken(
      principal.userId,
      token,
    )
  } else {
    await claimUserPushToken(
      principal.userId,
      token,
    )
  }

  return NextResponse.json({ ok: true })
}
