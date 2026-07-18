//app/api/alerts/metrics/route.ts

import { NextResponse } from 'next/server'
import { listPerformances } from '@/lib/alerts/alertPerformanceStore'
import {
  calculateSharpe,
  calculateMaxDrawdown,
} from '@/lib/alerts/alertMetrics'
import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'

export async function GET() {
  const principal =
    await resolveNotificationPrincipal()

  const perf = await listPerformances(
    principal.userId,
  )

  const returns = perf
    .filter(p => p.pnlPercent !== undefined)
    .map(p => p.pnlPercent!)

  return NextResponse.json({
    sharpe: calculateSharpe(returns),
    maxDrawdown: calculateMaxDrawdown(returns),
  })
}
