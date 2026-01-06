// app/api/alerts/test-trigger/route.ts
import { NextResponse } from 'next/server'
import { handlePriceTick } from '@/lib/alerts/alertEngine'

export async function POST(req: Request) {
  const { symbol, price } = await req.json()

  await handlePriceTick({
    symbol,
    price,
    mode: 'tick', // 🔥 중요
  })

  return NextResponse.json({ ok: true })
}
