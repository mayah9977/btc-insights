export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import {
  registerPushToken,
  unregisterPushToken,
} from '@/lib/alerts/pushTokenStore'

export async function POST(req: Request) {
  const body = await req.json()

  const userId = body.userId ?? 'dev-user'
  const token = body.token as string
  const action = (body.action as 'register' | 'unregister') ?? 'register'

  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'Missing token' },
      { status: 400 },
    )
  }

  if (action === 'unregister') {
    await unregisterPushToken(userId, token)
  } else {
    await registerPushToken(userId, token)
  }

  return NextResponse.json({ ok: true })
}
