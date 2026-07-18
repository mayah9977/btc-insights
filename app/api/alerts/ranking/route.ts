//app/api/alerts/ranking/route.ts

import { NextResponse } from 'next/server'
import { rankAlerts } from '@/lib/alerts/alertRanking'
import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'

export async function GET() {
  const principal =
    await resolveNotificationPrincipal()

  return NextResponse.json(
    await rankAlerts(
      principal.userId,
    )
  )
}
