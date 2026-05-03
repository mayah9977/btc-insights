import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import { markNotificationsRead } from '@/lib/notification/repository'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const viewerId = user.id

    const body = await req.json().catch(() => ({}))

    const vipLevel = await getUserVIPLevel(viewerId)
    const isVIP = vipLevel === 'VIP'

    const ids = Array.isArray(body?.ids)
      ? body.ids.filter(
          (id: unknown): id is string => typeof id === 'string',
        )
      : undefined

    const unreadCount = await markNotificationsRead({
      viewerId,
      isVIP,
      ids,
    })

    return NextResponse.json({
      ok: true,
      unreadCount,
    })
  } catch (error) {
    console.error('[READ_NOTIFICATION]', error)

    return NextResponse.json(
      { ok: false, unreadCount: 0 },
      { status: 500 },
    )
  }
}
