import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import { deleteAllNotifications } from '@/lib/notification/repository'

export async function POST() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Unauthorized',
        },
        { status: 401 },
      )
    }

    const viewerId = user.id

    const vipLevel = await getUserVIPLevel(viewerId)
    const isVIP = vipLevel === 'VIP'

    const result = await deleteAllNotifications({
      viewerId,
      isVIP,
    })

    return NextResponse.json({
      ok: true,
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    console.error('[DELETE_ALL_NOTIFICATIONS]', error)

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    )
  }
}
