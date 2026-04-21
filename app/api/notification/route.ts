import { NextRequest, NextResponse } from 'next/server'
import { getUserVIP } from '@/lib/auth/getUserVIP'
import {
  getNotificationsLast12h,
  getUnreadCountLast12h,
} from '@/lib/notification/repository'

export async function GET(req: NextRequest) {
  try {
    const isVIP = await getUserVIP('local')
    const viewerId = 'local'
    const mode = req.nextUrl.searchParams.get('mode')

    const unreadCount = await getUnreadCountLast12h({
      viewerId,
      isVIP,
    })

    if (mode === 'badge') {
      return NextResponse.json({
        ok: true,
        unreadCount,
        isVIP,
      })
    }

    const notifications = await getNotificationsLast12h({
      viewerId,
      isVIP,
    })

    return NextResponse.json({
      ok: true,
      notifications,
      unreadCount,
      isVIP,
    })
  } catch (error) {
    console.error('[API_NOTIFICATION]', error)

    return NextResponse.json(
      {
        ok: false,
        notifications: [],
        unreadCount: 0,
        isVIP: false,
      },
      { status: 500 },
    )
  }
}
