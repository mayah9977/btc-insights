//app/api/notification/delete/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import { deleteNotification } from '@/lib/notification/repository'

export async function POST(req: NextRequest) {
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

    let body: unknown = null

    try {
      body = await req.json()
    } catch (error) {
      console.error(
        '[DELETE_NOTIFICATION] invalid json body:',
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

    if (
      typeof payload.id !== 'string' ||
      payload.id.trim().length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'invalid-payload',
        },
        { status: 400 },
      )
    }

    const id = payload.id.trim()

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

    const result = await deleteNotification({
      viewerId,
      id,
    })

    return NextResponse.json({
      ok: true,
      deleted: result,
    })
  } catch (error) {
    console.error('[DELETE_NOTIFICATION]', error)

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    )
  }
}
