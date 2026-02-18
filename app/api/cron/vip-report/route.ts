import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'
import { redis } from '@/lib/redis/server'
import { getWhaleIntensity } from '@/lib/vip/redis/saveWhaleIntensity'
import { getSentimentSnapshot } from '@/lib/vip/redis/saveSentimentSnapshot'

import { fetchCandle15m } from '@/lib/market/fetchCandle15m'
import { renderCandleChartBase64 } from '@/lib/pdf/renderCandleChartBase64'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SYMBOL = 'BTCUSDT'

const WHALE_TEXT_KEY = 'vip:intel:whale:text'
const SENTIMENT_TEXT_KEY = 'vip:intel:sentiment:text'
const NEWS_KEY = 'market:context:latest'

/** ✅ 유효한 1x1 PNG dataURL (PDF 렌더 실패 방지) */
const FALLBACK_PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ajmR6cAAAAASUVORK5CYII='

function toNumberSafe(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export async function GET() {
  try {
    /* =====================================================
       1️⃣ BTC Snapshot (Redis 기반)
    ===================================================== */

    const [priceRaw, fundingRaw, oiRaw] = await Promise.all([
      redis.get(`market:last:price:${SYMBOL}`),
      redis.get(`market:last:funding:${SYMBOL}`),
      redis.get(`market:last:oi:${SYMBOL}`),
    ])

    const btcPrice = toNumberSafe(priceRaw, 0)
    const fundingRate = toNumberSafe(fundingRaw, 0)
    const openInterest = toNumberSafe(oiRaw, 0)

    /* =====================================================
       2️⃣ 15분 캔들 + 차트 렌더링
    ===================================================== */

    let candleChartBase64 = FALLBACK_PNG_1X1

    try {
      const candles = await fetchCandle15m(SYMBOL)
      if (candles?.length) {
        const rendered = await renderCandleChartBase64(candles)
        if (rendered && rendered.startsWith('data:image/')) {
          candleChartBase64 = rendered
        }
      }
    } catch (err) {
      console.error('[CANDLE ERROR]', err)
      // fallback 유지
    }

    /* =====================================================
       3️⃣ Whale
    ===================================================== */

    const whaleSnapshot = await getWhaleIntensity()
    const whaleIntensity = toNumberSafe(whaleSnapshot?.intensity, 0)

    const whaleInterpretation =
      (await redis.get(WHALE_TEXT_KEY)) ??
      '현재 고래 활동 데이터를 분석 중입니다.'

    /* =====================================================
       4️⃣ Sentiment
    ===================================================== */

    const sentimentSnapshot = await getSentimentSnapshot()

    const sentimentIndex = toNumberSafe(sentimentSnapshot?.index, 50)
    const sentimentRegime: 'FEAR' | 'NEUTRAL' | 'GREED' =
      sentimentSnapshot?.regime ?? 'NEUTRAL'

    const sentimentInterpretation =
      (await redis.get(SENTIMENT_TEXT_KEY)) ??
      '현재 시장 심리는 중립 구간입니다.'

    /* =====================================================
       5️⃣ 뉴스 (market:context:latest)
    ===================================================== */

    let newsSummary =
      '오늘의 주요 뉴스 데이터가 아직 생성되지 않았습니다.'
    let newsMidLongTerm =
      '구조적 관점에서 변동성 구간을 관찰해야 합니다.'

    try {
      const newsRaw = await redis.get(NEWS_KEY)
      if (newsRaw) {
        const parsed = JSON.parse(newsRaw)
        newsSummary = parsed?.summary ?? newsSummary
        newsMidLongTerm = parsed?.midLongTerm ?? newsMidLongTerm
      }
    } catch (err) {
      console.error('[NEWS PARSE ERROR]', err)
    }

    /* =====================================================
       6️⃣ PDF 생성 (✅ 최신 DailyReportInput 구조 100% 일치)
       - structuralAnalysis 제거 완료
    ===================================================== */

    const pdfBytes = await generateVipDailyReportPdf({
      date: new Date().toISOString().slice(0, 10),
      market: 'BTC',
      vipLevel: 'VIP3',

      btcPrice,
      openInterest,
      fundingRate,
      candleChartBase64,

      whaleIntensity,
      whaleInterpretation,

      sentimentIndex,
      sentimentRegime,
      sentimentInterpretation,

      newsSummary,
      newsMidLongTerm,
    })

    return new Response(new Uint8Array(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="btc-vip-report.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('[VIP REPORT ERROR]', error)

    return new Response(
      JSON.stringify({
        ok: false,
        error: error?.message ?? 'unknown error',
      }),
      { status: 500 },
    )
  }
}
