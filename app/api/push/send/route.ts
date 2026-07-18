//app/api/push/send/route.ts

import { NextResponse } from 'next/server'
import { adminMessaging } from '@/lib/firebase-admin'

/**
 * POST /api/push/send
 * body:
 * {
 *   token: string,
 *   title?: string,
 *   body?: string,
 *   clickUrl?: string
 * }
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, {
      status: 404,
    })
  }

  try {
    const { token, title, body, clickUrl } = await req.json()

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'TOKEN_REQUIRED' },
        { status: 400 }
      )
    }

    const message = {
      token,
      notification: {
        title: title ?? '🚨 BTC 알림',
        body: body ?? '설정한 가격 조건이 충족되었습니다.',
      },
      data: {
        clickUrl: clickUrl ?? '/ko/alerts',
        tag: 'btc-alert',
        requireInteraction: 'true',
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          icon: '/icon/192.png',
          badge: '/badge/72.png',
        },
      },
    }

    const res = await adminMessaging.send(message)

    return NextResponse.json({
      ok: true,
      messageId: res,
    })
  } catch (e: any) {
    console.error('[FCM SEND ERROR]', e)
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'UNKNOWN_ERROR' },
      { status: 500 }
    )
  }
}
