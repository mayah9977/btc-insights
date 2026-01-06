import { NextResponse } from 'next/server'
import { handlePriceTick } from '@/lib/alerts/alertEngine'

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret')

  if (secret !== process.env.CRON_SECRET) {
    console.error('[CRON][PRICE-POLL] INVALID SECRET')
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  try {
    const symbol = 'BTCUSDT'

    // ✅ 가격 소스는 PRICE API
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/market/price?symbol=${symbol}`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      throw new Error(`PRICE_SOURCE_ERROR_${res.status}`)
    }

    const data = await res.json()
    const price = Number(data.price)

    if (!Number.isFinite(price)) {
      throw new Error('INVALID_PRICE')
    }

    // 🔹 알림 엔진 주입 (PRICE 기준)
    await handlePriceTick({ symbol, price })

    return NextResponse.json({
      ok: true,
      symbol,
      price,
      ts: Date.now(),
    })
  } catch (e: any) {
    console.error('[CRON][PRICE-POLL] ERROR', e)

    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: e.message,
      },
      { status: 500 }
    )
  }
}

// ❌ GET 요청 차단 유지
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: 'METHOD_NOT_ALLOWED',
    },
    { status: 405 }
  )
}
