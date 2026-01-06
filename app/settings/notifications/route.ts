import { NextRequest, NextResponse } from 'next/server'
import { saveUserNotificationSettings } from '@/lib/notification/settingsStore'
import { verifySession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  const user = await verifySession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await req.json()
  await saveUserNotificationSettings(user.id, settings)

  return NextResponse.json({ ok: true })
}
