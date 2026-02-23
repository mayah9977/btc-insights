/* =========================================================
   API: Get Market Context (News + VIP OS 통합)
   ✔ latest 우선
   ✔ latest 없으면 previous fallback
   ✔ 둘 다 없으면 안전 기본값
========================================================= */

import { redis } from '@/lib/redis/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    /* ===============================
       1️⃣ GPT 뉴스 컨텍스트
       latest → previous fallback
    =============================== */

    let news: any = null

    // 🔥 1-1 latest 조회
    const latestRaw = await redis.get('market:context:latest')

    if (latestRaw) {
      try {
        news = JSON.parse(latestRaw)
      } catch (err) {
        console.error('[MarketContextAPI] latest JSON parse error:', err)
      }
    }

    // 🔥 1-2 latest 없으면 previous fallback
    if (!news) {
      console.warn('[MarketContextAPI] latest missing → fallback to previous')

      const prevRaw = await redis.get('market:context:previous')

      if (prevRaw) {
        try {
          news = JSON.parse(prevRaw)
        } catch (err) {
          console.error('[MarketContextAPI] previous JSON parse error:', err)
        }
      }
    }

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

    let whale = null
    let sentiment = null

    try {
      whale = whaleRaw ? JSON.parse(whaleRaw) : null
    } catch {}

    try {
      sentiment = sentimentRaw ? JSON.parse(sentimentRaw) : null
    } catch {}

    /* ===============================
       3️⃣ 응답 구조
    =============================== */

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          translatedHeadlines: news?.translatedHeadlines ?? [],
          summary: news?.summary ?? '',
          midLongTerm: news?.midLongTerm ?? '',
          updatedAt: news?.updatedAt ?? 0, // 🔥 fallback은 Date.now() 쓰지 않음

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
