// app/api/notification/register-push-token/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { claimUserPushToken } from '@/lib/push/pushStore'
import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'

/**
 * Client → Server Push Token Register
 * 서버 principal 기반 token 소유권 등록
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (
      typeof token !== 'string' ||
      !token.trim()
    ) {
      return NextResponse.json(
        { ok: false, error: 'TOKEN_REQUIRED' },
        { status: 400 },
      )
    }

    const principal =
      await resolveNotificationPrincipal()

    await claimUserPushToken(
      principal.userId,
      token.trim(),
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API] registerPushToken error', err)

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    )
  }
}
