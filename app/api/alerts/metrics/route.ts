import { NextResponse } from 'next/server'
import { listPerformances } from '@/lib/alerts/alertPerformanceStore'
import {
  calculateSharpe,
  calculateMaxDrawdown,
} from '@/lib/alerts/alertMetrics'

const DEV_USER_ID = 'dev-user'

export async function GET() {
  const perf = await listPerformances(DEV_USER_ID)

  const returns = perf
    .filter(p => p.pnlPercent !== undefined)
    .map(p => p.pnlPercent!)

  return NextResponse.json({
    sharpe: calculateSharpe(returns),
    maxDrawdown: calculateMaxDrawdown(returns),
  })
}
