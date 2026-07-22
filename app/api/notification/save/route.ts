//app/api/notification/save/route.ts

import { NextResponse } from 'next/server'
import {
  saveNotification,
  type NotificationItem,
} from '@/lib/notification/repository'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { isVIP } from '@/lib/vip/vipServer'

type AllowedNotificationPayload = NotificationItem & {
  type: 'BTC_ALERT' | 'INDICATOR'
}

function isAllowedNotificationPayload(
  value: unknown,
): value is AllowedNotificationPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const payload =
    value as Record<string, unknown>

  return (
    typeof payload.id === 'string' &&
    (payload.type === 'BTC_ALERT' ||
      payload.type === 'INDICATOR') &&
    typeof payload.title === 'string' &&
    typeof payload.body === 'string' &&
    typeof payload.createdAt === 'number' &&
    Number.isFinite(payload.createdAt)
  )
}

export async function POST(req: Request) {
  try {
    let body: unknown = null

    // 🔥 NEW: req.json stable
    try {
      body = await req.json()
    } catch (error) {
      console.error('[SAVE_NOTIFICATION] invalid json body:', error)

      return NextResponse.json(
        { ok: false, reason: 'invalid-json-body' },
        { status: 400 },
      )
    }

    // 🔥 NEW: empty body defense
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { ok: false, reason: 'empty-body' },
        { status: 400 },
      )
    }

    if (!isAllowedNotificationPayload(body)) {
      return NextResponse.json(
        { ok: false, reason: 'invalid-payload' },
        { status: 400 },
      )
    }

    const currentUser =
      await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        {
          ok: false,
          error: 'UNAUTHORIZED',
        },
        { status: 401 },
      )
    }

    const vipActive =
      await isVIP(currentUser.id)

    if (!vipActive) {
      return NextResponse.json(
        {
          ok: false,
          error: 'VIP_REQUIRED',
        },
        { status: 403 },
      )
    }

    const notification: AllowedNotificationPayload = {
      id: body.id,
      type: body.type,
      title: body.title,
      body: body.body,
      createdAt: body.createdAt,
    }

    await saveNotification(
      currentUser.id,
      notification,
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[SAVE_NOTIFICATION]', error)

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    )
  }
}
