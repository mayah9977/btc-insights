import { NextResponse } from 'next/server'
import { rankAlerts } from '@/lib/alerts/alertRanking'
import { recommendPositionStrategy } from '@/lib/ai/positionStrategy'

const DEV_USER_ID = 'dev-user'

export async function GET() {
  const ranked = await rankAlerts(DEV_USER_ID)

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
