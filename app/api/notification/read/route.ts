//app/api/notification/read/route.ts

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import { markNotificationsRead } from '@/lib/notification/repository'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'UNAUTHORIZED' },
        { status: 401 },
      )
    }

    const viewerId = user.id

    let body: unknown = null

    try {
      body = await req.json()
    } catch (error) {
      console.error(
        '[READ_NOTIFICATION] invalid json body:',
        error,
      )

      return NextResponse.json(
        {
          ok: false,
          reason: 'invalid-json-body',
        },
        { status: 400 },
      )
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'invalid-payload',
        },
        { status: 400 },
      )
    }

    const payload =
      body as Record<string, unknown>

    let ids: string[] | undefined

    if ('ids' in payload) {
      const candidateIds = payload.ids

      if (
        !Array.isArray(candidateIds) ||
        candidateIds.some(
          (id: unknown) =>
            typeof id !== 'string',
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            reason: 'invalid-payload',
          },
          { status: 400 },
        )
      }

      ids = candidateIds as string[]
    }

    const vipLevel = await getUserVIPLevel(viewerId)
    const isVIP = vipLevel === 'VIP'

    if (!isVIP) {
      return NextResponse.json(
        { ok: false, error: 'VIP_REQUIRED' },
        { status: 403 },
      )
    }

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
