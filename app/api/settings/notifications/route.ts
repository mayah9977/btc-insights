// app/api/settings/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import {
  getUserNotificationSettings,
  saveUserNotificationSettings,
} from '@/lib/notification/settingsStore'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)

  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 },
    )
  }

  const settings = await getUserNotificationSettings(user.id)

  return NextResponse.json(settings, {
    headers: {
      'Cache-Control': 'no-store, no-cache',
    },
  })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)

  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 },
    )
  }

  const body = await req.json()

  await saveUserNotificationSettings(user.id, body)

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache',
      },
    },
  )
}
