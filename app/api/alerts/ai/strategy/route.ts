// app/api/alerts/ai/strategy/route.ts

import { NextResponse } from 'next/server'
import { rankAlerts } from '@/lib/alerts/alertRanking'
import { recommendPositionStrategy } from '@/lib/ai/positionStrategy'
import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'

export async function GET() {
  const principal =
    await resolveNotificationPrincipal()

  const ranked = await rankAlerts(
    principal.userId,
  )

  const strategies = ranked.map(r => ({
    alertId: r.alertId,
    symbol: r.symbol,
    strategy: recommendPositionStrategy({
      hitRate: r.hitRate,
      avgPnL: r.avgPnL,
      volatility: Math.abs(r.avgPnL) / 100,
    }),
  }))

  return NextResponse.json(strategies)
}
