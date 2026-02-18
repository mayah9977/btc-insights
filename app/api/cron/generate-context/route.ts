/* =========================================================
   Cron: Generate Market Context
   - Fetch RSS headlines
   - Generate Korean summary via GPT
   - Save to Redis (SSOT)
========================================================= */

import { fetchRssNews } from '@/lib/market-context/fetchRssNews'
import { generateKoreanContext } from '@/lib/market-context/generateKoreanContext'
import { saveMarketContext } from '@/lib/market-context/contextStore'

export const runtime = 'nodejs'

export async function GET() {
  try {
    console.log('[Cron] generate-context started')

    /* ===============================
       1️⃣ RSS Fetch
    =============================== */
    const headlines = await fetchRssNews()

    if (!headlines || headlines.length === 0) {
      console.warn('[Cron] No headlines fetched')

      return new Response(
        JSON.stringify({
          ok: false,
          error: 'no headlines fetched',
        }),
        { status: 400 }
      )
    }

    /* ===============================
       2️⃣ GPT 한국어 재작성
    =============================== */
    const {
      translatedHeadlines,
      summary,
      midLongTerm,
    } = await generateKoreanContext(headlines)

    /* ===============================
       3️⃣ Redis 저장 (SSOT)
    =============================== */
    const saved = await saveMarketContext({
      headlines,
      translatedHeadlines,
      summary,
      midLongTerm,
    })

    console.log('[Cron] Market context updated')

    return new Response(
      JSON.stringify({
        ok: true,
        updatedAt: saved.updatedAt,
        headlineCount: headlines.length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error: any) {
    console.error('[Cron] generate-context error:', error)

    return new Response(
      JSON.stringify({
        ok: false,
        error: error?.message ?? 'unknown error',
      }),
      { status: 500 }
    )
  }
}
