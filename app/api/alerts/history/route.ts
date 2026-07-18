//app/api/alerts/history/route.ts

import { NextResponse } from 'next/server'
import { listAlertHistories } from '@/lib/alerts/alertHistoryStore'
import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'

export async function GET() {
  const principal =
    await resolveNotificationPrincipal()

  const data = await listAlertHistories(
    principal.userId,
  )

  return NextResponse.json(data)
}
