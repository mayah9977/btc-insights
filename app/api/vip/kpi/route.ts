// app/api/vip/kpi/route.ts
import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { isVIP } from '@/lib/vip/vipServer'

import { getVipKpiSnapshot } from '@/lib/vip/redis/getVipKpiSnapshot'
import { getVIP3Metrics } from '@/lib/vip/redis/getVIP3Metrics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    /* =========================
     * ✅ VIP Verification
     * ========================= */

    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const hasVIPAccess = await isVIP(user.id)

    if (!hasVIPAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    /* =========================
     * ✅ KPI + Metrics parallel inquiry
     * ========================= */

    const [kpi, vip3] = await Promise.all([
      getVipKpiSnapshot(),
      getVIP3Metrics(),
    ])

    /* =========================
     * ✅ Response
     * ========================= */

    return NextResponse.json({
      ok: true,
      kpi,
      vip3,
    })
  } catch (error) {
    console.error('[API_VIP_KPI]', error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to load VIP KPI',
      },
      { status: 500 },
    )
  }
}
