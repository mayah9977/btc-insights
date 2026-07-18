//app/api/admin/vip/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { recoverVIP, downgradeUserVIP } from '@/lib/vip/vipDB'
import { requireAdminUser } from '@/lib/auth/adminAccess'
import type { VIPLevel } from '@/lib/vip/vipTypes'

/** 🔥 priceId → VIPLevel 변환 */
function mapPriceToVIPLevel(priceId: string): VIPLevel {
  switch (priceId) {
    case 'MONTHLY':
    case 'YEAR':
      return 'VIP'

    default:
      return 'VIP' // 기본 fallback
  }
}

export async function POST(req: NextRequest) {
  try {
    /** 🔐 관리자 인증 */
    const admin = await requireAdminUser()

    const body = await req.json()

    const {
      userId,
      action,
      priceId,
      level,
    }: {
      userId?: string
      action?: 'expire' | 'recover' | 'override'
      priceId?: string
      level?: VIPLevel
    } = body

    /** ❗ 입력 검증 */
    if (!userId || !action) {
      return NextResponse.json(
        { ok: false, error: 'Invalid payload' },
        { status: 400 },
      )
    }

    /** 🔽 VIP 강제 만료 */
    if (action === 'expire') {
      await downgradeUserVIP(userId)

      return NextResponse.json({
        ok: true,
        action: 'expired',
      })
    }

    /** 🔼 VIP 복구 */
    if (action === 'recover') {
      if (!priceId) {
        return NextResponse.json(
          { ok: false, error: 'priceId required' },
          { status: 400 },
        )
      }

      const vipLevel = mapPriceToVIPLevel(priceId)
      const days = 30

      await recoverVIP(userId, vipLevel, days)

      return NextResponse.json({
        ok: true,
        action: 'recovered',
      })
    }

    /** 👑 관리자 강제 VIP */
    if (action === 'override') {
      if (!level) {
        return NextResponse.json(
          { ok: false, error: 'level required' },
          { status: 400 },
        )
      }

      const days = 30

      await recoverVIP(userId, level, days)

      return NextResponse.json({
        ok: true,
        action: 'override',
      })
    }

    /** ❌ 잘못된 action */
    return NextResponse.json(
      { ok: false, error: 'Invalid action' },
      { status: 400 },
    )
  } catch (error) {
    console.error('[ADMIN_VIP_API]', error)

    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 403 },
    )
  }
}
