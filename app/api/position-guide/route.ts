// app/api/position-guide/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { saveRiskEvent } from '@/lib/vip/redis/saveRiskEvent'
import { calcPositionGuide } from '@/lib/risk/calcPositionGuide'

export const runtime = 'nodejs' // ✅ Redis 사용 필수

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      risk,
      pressure,
      entryPrice,
      worstPrice,
      position,
      isExtreme,
    } = body

    const guide = calcPositionGuide(risk, pressure)


    // 🔒 saveRiskEvent는 calcPositionGuide 내부에서만 발생
    // (HIGH + 조건 충족 시)

    return NextResponse.json({
      ok: true,
      guide,
    })
  } catch (err) {
    console.error('[position-guide]', err)
    return NextResponse.json(
      { ok: false },
      { status: 500 }
    )
  }
}
