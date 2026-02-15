/* =========================================================
   API: Get Market Context
   - Read latest context from Redis
   - No GPT call here
   - No real-time requirement
========================================================= */

import { getMarketContext } from '@/lib/market-context/contextStore'

export const runtime = 'nodejs' // ✅ 서버 강제

export async function GET() {
  try {
    const data = await getMarketContext()

    if (!data) {
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'no context available',
        }),
        { status: 404 }
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store', // 항상 최신값
        },
      }
    )
  } catch (error: any) {
    console.error('[API] market/context error:', error)

    return new Response(
      JSON.stringify({
        ok: false,
        error: error?.message || 'unknown error',
      }),
      { status: 500 }
    )
  }
}
