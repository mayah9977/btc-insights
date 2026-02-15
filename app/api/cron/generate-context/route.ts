/* =========================================================
   Cron: Generate Market Context
   - Fetch RSS headlines
   - Generate Korean summary via GPT
   - Save to Redis
   - Runs 4 times per day (Vercel Cron)
========================================================= */

import { fetchRssNews } from '@/lib/market-context/fetchRssNews'
import { generateKoreanContext } from '@/lib/market-context/generateKoreanContext'
import { saveMarketContext } from '@/lib/market-context/contextStore'

export const runtime = 'nodejs' // ✅ 서버 강제

export async function GET() {
  try {
    console.log('[Cron] generate-context started')

    // 1️⃣ RSS Fetch
    const headlines = await fetchRssNews()

    if (!headlines.length) {
      console.warn('[Cron] No headlines fetched')
    }

    // 2️⃣ GPT 한국어 재작성
    const { translatedHeadlines, summary, midLongTerm } =
  await generateKoreanContext(headlines)

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
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Cron] generate-context error:', error)

    return new Response(
      JSON.stringify({
        ok: false,
        error: error?.message || 'unknown error',
      }),
      { status: 500 }
    )
  }
}
