import { NextResponse } from 'next/server'
import { handlePriceTick } from '@/lib/alerts/alertEngine'

export async function POST(req: Request) {
  const body = await req.json()

  const symbol =
    typeof body.symbol === 'string'
      ? body.symbol.toUpperCase()
      : null

  const price = Number(body.price)

  if (!symbol || !Number.isFinite(price)) {
    return NextResponse.json(
      { error: 'INVALID_PAYLOAD' },
      { status: 400 }
    )
  }

  console.log('[TEST TRIGGER]', { symbol, price })

  await handlePriceTick({
    symbol,
    price,
  })

  return NextResponse.json({ ok: true })
}
