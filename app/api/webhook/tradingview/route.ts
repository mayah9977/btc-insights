//app/api/webhook/tradingview/route.ts

import { NextResponse } from 'next/server'
import { handlePriceTick } from '@/lib/alerts/alertEngine'

export async function POST(req: Request) {
  /* =========================
   * 🔐 Webhook Secret 검증
   * ========================= */
  const headerSecret = req.headers.get('x-webhook-secret')
  const envSecret = process.env.WEBHOOK_SECRET

  if (!envSecret || headerSecret !== envSecret) {
    console.error('[TV WEBHOOK] UNAUTHORIZED', {
      headerSecret,
    })

    return NextResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  /* =========================
   * Payload 파싱
   * ========================= */
  let body: any
  try {
    body = await req.json()
  } catch {
    console.error('[TV WEBHOOK] INVALID JSON')

    return NextResponse.json(
      { error: 'INVALID_JSON' },
      { status: 400 }
    )
  }

  /**
   * TradingView Payload 예:
   * {
   *   "symbol": "BTCUSDT",
   *   "price": 80123.45
   * }
   */
  const rawSymbol = body.symbol
  const rawPrice = body.price

  const symbol =
    typeof rawSymbol === 'string'
      ? rawSymbol.toUpperCase()
      : null

  const price = Number(rawPrice)

  /* =========================
   * Payload 검증
   * ========================= */
  if (!symbol || !Number.isFinite(price) || price <= 0) {
    console.error('[TV WEBHOOK] INVALID_PAYLOAD', {
      symbol: rawSymbol,
      price: rawPrice,
    })

    return NextResponse.json(
      { error: 'INVALID_PAYLOAD' },
      { status: 400 }
    )
  }

  /* =========================
   * ✅ 엔진 호출
   * ========================= */
  console.log('[TV WEBHOOK] PRICE TICK RECEIVED', {
    symbol,
    price,
  })

  try {
    await handlePriceTick({
      symbol,
      price,
      mode: 'tick',
    })

    console.log('[TV WEBHOOK] ALERT ENGINE CALLED', {
      symbol,
      price,
    })
  } catch (e) {
    console.error('[TV WEBHOOK] ALERT ENGINE ERROR', e)

    return NextResponse.json(
      { error: 'ENGINE_ERROR' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
