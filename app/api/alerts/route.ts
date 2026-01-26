import { NextResponse } from 'next/server'
import { createAlert, listAlerts } from '@/lib/alerts/alertStore.server'
import { forceEvaluatePrice } from '@/lib/market/pricePolling'
import { fetchCurrentMarketPrice } from '@/lib/market/fetchCurrentMarketPrice'
import type { AlertCondition } from '@/lib/alerts/alertTypes'

const USER_ID = 'dev-user'

/* =========================
 * GET /api/alerts
 * ========================= */
export async function GET() {
  try {
    const alerts = await listAlerts(USER_ID)
    return NextResponse.json({ ok: true, alerts })
  } catch (e) {
    console.error('[ALERTS][GET]', e)
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}

/* =========================
 * POST /api/alerts
 * ========================= */
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const condition = body.condition as AlertCondition
    const isPercent =
      condition === 'PERCENT_UP' || condition === 'PERCENT_DOWN'

    /**
     * 🔥 basePrice는 서버에서 fetch로만 결정
     */
    let basePrice: number | undefined = undefined

    if (isPercent) {
      const fetched = await fetchCurrentMarketPrice(body.symbol)
      if (typeof fetched === 'number' && Number.isFinite(fetched)) {
        basePrice = fetched
      }
    }

    // 1️⃣ 알림 생성
    const alert = await createAlert({
      userId: USER_ID,
      exchange: 'BINANCE',
      symbol: body.symbol,
      condition,

      // 절대값 조건
      targetPrice:
        condition === 'ABOVE' ||
        condition === 'BELOW' ||
        condition === 'REACH'
          ? body.targetPrice
          : undefined,

      // 퍼센트 조건
      basePrice,
      percent: isPercent ? body.percent : undefined,

      repeatMode: body.repeatMode ?? 'ONCE',
    })

    // 2️⃣ 생성 직후 즉시 1회 평가
    await forceEvaluatePrice({
      symbol: alert.symbol,
    })

    return NextResponse.json({ ok: true, alert })
  } catch (e: any) {
    console.error('[ALERTS][POST]', e)
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: e?.message,
      },
      { status: 500 },
    )
  }
}
