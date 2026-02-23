import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis/server'

import { fetchFearGreedIndex } from '@/lib/sentiment/fetchFearGreed'
import { setLastSentiment } from '@/lib/sentiment/sentimentLastStateStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('[CRON] update-sentiment started')

    const value = await fetchFearGreedIndex()

    if (value == null) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch sentiment' },
        { status: 500 },
      )
    }

    /* =========================
       1️⃣ In-memory 보조 SSOT
    ========================= */
    setLastSentiment(value)

    /* =========================
       2️⃣ Redis = 진짜 SSOT
       TTL 제거
    ========================= */
    await redis.set('market:sentiment:last', value)

    /* =========================
       3️⃣ SSE broadcast
    ========================= */
    await redis.publish(
      'realtime:market',
      JSON.stringify({
        type: 'SENTIMENT_UPDATE',
        symbol: 'BTCUSDT',
        sentiment: value,
        ts: Date.now(),
      }),
    )

    console.log('[CRON] sentiment updated:', value)

    return NextResponse.json({
      ok: true,
      sentiment: value,
    })
  } catch (err: any) {
    console.error('[CRON] update-sentiment error', err)

    return NextResponse.json(
      { ok: false, error: err?.message ?? 'unknown error' },
      { status: 500 },
    )
  }
}
