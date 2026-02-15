// app/api/market/sentiment/route.ts

import { NextResponse } from 'next/server'

/**
 * ⚠️ DEPRECATED
 * Polling API is disabled.
 * Sentiment is now delivered via SSE (SENTIMENT_UPDATE).
 */
export async function GET() {
  return NextResponse.json(
    {
      deprecated: true,
      message:
        'Polling sentiment API is disabled. Use SSE (SENTIMENT_UPDATE) instead.',
      sentiment: null,
    },
    { status: 410 }, // 410 Gone
  )
}
