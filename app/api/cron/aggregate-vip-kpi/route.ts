import { NextResponse } from 'next/server'
import { aggregateDailyVipKpi } from '@/lib/vip/redis/aggregateVipKpi'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await aggregateDailyVipKpi()

    return NextResponse.json({
      ok: true,
      message: 'VIP KPI aggregation completed',
      executedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[CRON][VIP KPI]', error)

    return NextResponse.json(
      {
        ok: false,
        message: 'VIP KPI aggregation failed',
      },
      { status: 500 },
    )
  }
}
