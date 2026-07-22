// app/api/notification/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import {
  getNotificationsLast12h,
  getUnreadCountLast12h,
} from '@/lib/notification/repository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: 'UNAUTHORIZED',
        },
        { status: 401 },
      )
    }

    const viewerId = user.id
    const vipLevel = await getUserVIPLevel(viewerId)
    const isVIP = vipLevel === 'VIP'

    if (!isVIP) {
      return NextResponse.json(
        {
          ok: false,
          error: 'VIP_REQUIRED',
        },
        { status: 403 },
      )
    }

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
        authenticated: true,
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
      authenticated: true,
    })
  } catch (error) {
    console.error('[API_NOTIFICATION]', error)

    return NextResponse.json(
      {
        ok: false,
        notifications: [],
        unreadCount: 0,
        isVIP: false,
        authenticated: false,
      },
      { status: 500 },
    )
  }
}
