//app/api/push/register/route.ts

import { NextResponse } from 'next/server'
import { claimUserPushToken } from '@/lib/push/pushStore'
import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const token = body?.token

    if (typeof token !== 'string' || !token.trim()) {
      return NextResponse.json(
        { ok: false, error: 'TOKEN_REQUIRED' },
        { status: 400 }
      )
    }

    const principal =
      await resolveNotificationPrincipal()

    await claimUserPushToken(
      principal.userId,
      token.trim(),
    )

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('🔥 PUSH REGISTER ERROR:', e)

    return NextResponse.json(
      {
        ok: false,
        error: 'SERVER_ERROR',
        message: e?.message ?? 'unknown',
      },
      { status: 500 }
    )
  }
}
