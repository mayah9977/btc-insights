// app/api/alerts/test-trigger/route.ts
import { NextResponse } from 'next/server'
import { handlePriceTick } from '@/lib/alerts/alertEngine'

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, {
      status: 404,
    })
  }

  const { symbol, price } = await req.json()

  await handlePriceTick({
    symbol,
    price,
    mode: 'tick', // 🔥 중요
  })

  return NextResponse.json({ ok: true })
}
