import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'

import { getVipKpiSnapshot } from '@/lib/vip/redis/getVipKpiSnapshot'
import { getVIP3Metrics } from '@/lib/vip/redis/getVIP3Metrics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  /* =========================
   * ✅ VIP 인증
   * ========================= */
  const user = await verifySession()

  if (!user || user.vipLevel < 3) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  /* =========================
   * ✅ KPI + VIP3 병렬 조회
   * ========================= */
  const [kpi, vip3] = await Promise.all([
    getVipKpiSnapshot(), // 📖 Redis snapshot
    getVIP3Metrics(),    // 📖 VIP3 metrics
  ])

  /* =========================
   * ✅ Response
   * ========================= */
  return NextResponse.json({
    kpi,
    vip3,
  })
}
