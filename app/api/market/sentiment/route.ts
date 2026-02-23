import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const raw = await redis.get('market:sentiment:last')

    const sentiment =
      raw != null && Number.isFinite(Number(raw))
        ? Number(raw)
        : 50

    return NextResponse.json({
      ok: true,
      sentiment,
    })
  } catch (err) {
    console.error('[API] sentiment fetch failed', err)

    return NextResponse.json(
      { ok: false, sentiment: 50 },
      { status: 500 },
    )
  }
}