/* =========================================================
   API: Get Market Context (News + VIP OS 통합)
========================================================= */

import { redis } from '@/lib/redis/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    /* ===============================
       1️⃣ GPT 뉴스 컨텍스트
    =============================== */

    const newsRaw = await redis.get('market:context:latest')
    const news = newsRaw ? JSON.parse(newsRaw) : null

    /* ===============================
       2️⃣ VIP Intelligence SSOT
    =============================== */

    const [
      structuralRaw,
      whaleRaw,
      whaleText,
      sentimentRaw,
      sentimentText,
    ] = await Promise.all([
      redis.get('market:finalized:analysis'),
      redis.get('vip:intel:whale'),
      redis.get('vip:intel:whale:text'),
      redis.get('vip:intel:sentiment'),
      redis.get('vip:intel:sentiment:text'),
    ])

    const whale = whaleRaw ? JSON.parse(whaleRaw) : null
    const sentiment = sentimentRaw ? JSON.parse(sentimentRaw) : null

    /* ===============================
       3️⃣ UI 호환 구조로 Flatten
    =============================== */

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          /* 🔥 UI가 기대하는 뉴스 구조 */
          translatedHeadlines: news?.translatedHeadlines ?? [],
          summary: news?.summary ?? '',
          midLongTerm: news?.midLongTerm ?? '',
          updatedAt: news?.updatedAt ?? Date.now(),

          /* 🔥 VIP Intelligence 유지 */
          vip: {
            structuralAnalysis:
              structuralRaw ??
              'AI Risk Observation System is currently monitoring structural volatility shifts.',

            whale: {
              intensity: whale?.intensity ?? 0,
              level: whale?.level ?? 'LOW',
              interpretation:
                whaleText ??
                '현재 고래 강도 데이터를 수집 중입니다.',
            },

            sentiment: {
              index: sentiment?.index ?? 50,
              regime: sentiment?.regime ?? 'NEUTRAL',
              interpretation:
                sentimentText ??
                '현재 시장 심리 데이터를 수집 중입니다.',
            },
          },
        },
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
    console.error('[API] market/context error:', error)

    return new Response(
      JSON.stringify({
        ok: false,
        error: error?.message ?? 'unknown error',
      }),
      { status: 500 }
    )
  }
}
