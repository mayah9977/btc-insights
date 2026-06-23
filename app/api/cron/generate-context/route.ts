// app/api/cron/generate-context/route.ts

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
    console.log('[MARKET_CONTEXT_CRON_START]', {
      ts: Date.now(),
    })

    /* ===============================
       1️⃣ RSS Fetch
    =============================== */
    const headlines = await fetchRssNews()

    console.log('[MARKET_CONTEXT_CRON_RSS_RESULT]', {
      ts: Date.now(),
      count: headlines?.length ?? 0,
      firstTitle:
        headlines?.[0]?.title ?? null,
      firstPubDate:
        headlines?.[0]?.pubDate ?? null,
    })

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
      fallbackUsed,
    } = await generateKoreanContext(headlines)

    console.log('[MARKET_CONTEXT_CRON_GPT_RESULT]', {
      ts: Date.now(),
      translatedHeadlineCount:
        translatedHeadlines?.length ?? 0,
      summaryLength:
        summary?.length ?? 0,
      midLongTermLength:
        midLongTerm?.length ?? 0,
      fallbackUsed:
        fallbackUsed === true,
    })

    /* ===============================
       3️⃣ Redis 저장 (SSOT)
    =============================== */
    const saved = await saveMarketContext({
      headlines,
      translatedHeadlines,
      summary,
      midLongTerm,
    })

    console.log('[MARKET_CONTEXT_CRON_SAVED]', {
      ts: Date.now(),
      updatedAt: saved.updatedAt,
      headlineCount: headlines.length,
      translatedHeadlineCount:
        saved.translatedHeadlines?.length ?? 0,
      fallbackUsed:
        fallbackUsed === true,
    })

    return new Response(
      JSON.stringify({
        ok: true,
        updatedAt: saved.updatedAt,
        headlineCount: headlines.length,
        fallbackUsed:
          fallbackUsed === true,
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
