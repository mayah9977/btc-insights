import { NextResponse } from 'next/server'
import { handlePriceTick } from '@/lib/alerts/alertEngine'

export async function POST(req: Request) {
  const body = await req.json()

  const symbol = body.symbol?.toUpperCase()
  const price = Number(body.price)

  if (!symbol || !Number.isFinite(price)) {
    return NextResponse.json({ error: 'INVALID' }, { status: 400 })
  }

  console.log('[DEBUG TICK]', { symbol, price })

  await handlePriceTick({ symbol, price })

  return NextResponse.json({ ok: true })
}
