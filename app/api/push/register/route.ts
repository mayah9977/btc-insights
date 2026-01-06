import { NextResponse } from 'next/server'
import { saveUserPushToken } from '@/lib/push/pushStore'

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

    // 🔥 현재는 고정 (추후 auth 연동 시 교체)
    const userId = 'dev-user'

    await saveUserPushToken(userId, token)

    console.log('[API] push token registered', {
      userId,
      tokenPreview: token.slice(0, 12),
    })

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
