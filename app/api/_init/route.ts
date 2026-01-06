// app/api/_init/route.ts
import { NextResponse } from 'next/server'
import { ensurePricePollingStarted } from '@/lib/market/pricePolling'

export async function GET() {
  ensurePricePollingStarted()
  return NextResponse.json({ ok: true })
}
