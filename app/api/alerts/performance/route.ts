//app/api/alerts/performance/route.ts

import { NextResponse } from 'next/server'
import { listPerformances } from '@/lib/alerts/alertPerformanceStore'
import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'

export async function GET() {
  const principal =
    await resolveNotificationPrincipal()

  return NextResponse.json(
    await listPerformances(
      principal.userId,
    ),
  )
}
