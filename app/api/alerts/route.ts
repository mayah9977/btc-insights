import { NextResponse } from 'next/server'
import { createAlert, listAlerts } from '@/lib/alerts/alertStore.server'
import { handlePriceTick } from '@/lib/alerts/alertEngine'

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

    const alert = await createAlert({
      ...body,
      userId: USER_ID,
    })

    /* =========================
     * 🔥 저장 직후 즉시 1회 평가
     * - 이미 돌파된 알림도 즉시 트리거
     * - 서버에서는 절대 URL 필수
     * ========================= */
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        `http://localhost:${process.env.PORT ?? 3000}`

      const res = await fetch(
        `${baseUrl}/api/market/price?symbol=${alert.symbol}`,
        { cache: 'no-store' },
      )

      if (res.ok) {
        const data = await res.json()

        if (Number.isFinite(data?.price)) {
          await handlePriceTick({
            symbol: alert.symbol,
            price: Number(data.price),
            mode: 'initial', // 👈 핵심
          })
        }
      }
    } catch (e) {
      // ⚠️ 즉시 평가 실패는 치명적이지 않음
      console.warn('[ALERTS][POST][PRICE]', e)
    }

    return NextResponse.json({ ok: true, alert })
  } catch (e: any) {
    console.error('[ALERTS][POST]', e)
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: e?.message },
      { status: 500 },
    )
  }
}
