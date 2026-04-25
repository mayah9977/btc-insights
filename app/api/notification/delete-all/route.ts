import { NextResponse } from 'next/server'
import { getUserVIP } from '@/lib/auth/getUserVIP'
import { deleteAllNotifications } from '@/lib/notification/repository'

export async function POST() {
  try {
    const viewerId = 'local'
    const isVIP = await getUserVIP('local')

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
