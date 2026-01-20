// app/api/admin/vip/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { recoverVIP, downgradeUserVIP } from '@/lib/vip/vipDB'

export async function POST(req: NextRequest) {
  const { userId, action, priceId } = await req.json()

  if (!userId || !action) {
    return NextResponse.json(
      { ok: false, error: 'Invalid payload' },
      { status: 400 }
    )
  }

  // 🔽 VIP 만료
  if (action === 'expire') {
    await downgradeUserVIP(userId)
  }

  // 🔼 VIP 복구
  if (action === 'recover' && priceId) {
    // ✅ 임시 기본값 (예: 30일)
    const days = 30
    await recoverVIP(userId, priceId, days)
  }

  return NextResponse.json({ ok: true })
}
