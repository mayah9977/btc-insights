import { NextResponse } from 'next/server'
import { getUserVIP } from '@/lib/auth/getUserVIP'
import { markNotificationsRead } from '@/lib/notification/repository'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const isVIP = await getUserVIP('local')
    const viewerId = 'local'

    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown): id is string => typeof id === 'string')
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
