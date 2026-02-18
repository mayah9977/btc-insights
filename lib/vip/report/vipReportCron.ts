import { generateVipDailyReportPdf } from './vipDailyReportPdf'
import { sendVIPReportEmail } from './vipReportMailer'
import { sendVipReportPdf } from '@/lib/telegram/sendVipReportPdf'
import { getTelegramByUserId } from '@/lib/telegram/telegramStore'

import { redis } from '@/lib/redis/server'
import { getWhaleIntensity } from '@/lib/vip/redis/saveWhaleIntensity'
import { getSentimentSnapshot } from '@/lib/vip/redis/saveSentimentSnapshot'

import { fetchCandle15m } from '@/lib/market/fetchCandle15m'
import { renderCandleChartBase64 } from '@/lib/pdf/renderCandleChartBase64'

/* ===================================================== */

const WHALE_TEXT_KEY = 'vip:intel:whale:text'
const SENTIMENT_TEXT_KEY = 'vip:intel:sentiment:text'
const NEWS_KEY = 'market:context:latest'

const SYMBOL = 'BTCUSDT'

/**
 * 1x1 PNG 투명 fallback (유효한 dataURL)
 * - 깨진 base64 넣으면 pdf 렌더 시 이미지 에러로 전체 렌더 실패 가능
 */
const FALLBACK_PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ajmR6cAAAAASUVORK5CYII='

function toNumberSafe(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/* ===================================================== */

export async function runVIPDailyReport(email: string, userId: string) {
  try {
    /* =====================================================
       1️⃣ BTC 실시간 데이터 (Redis)
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
       2️⃣ 15분 캔들 + 서버 차트 렌더링 (A안)
    ===================================================== */

    let candleChartBase64 = FALLBACK_PNG_1X1

    try {
      const candles = await fetchCandle15m(SYMBOL)

      if (candles && candles.length > 0) {
        const rendered = await renderCandleChartBase64(candles)
        if (rendered && rendered.startsWith('data:image/')) {
          candleChartBase64 = rendered
        }
      }
    } catch (err) {
      console.error('[CANDLE RENDER ERROR]', err)
      // fallback 유지
    }

    /* =====================================================
       3️⃣ Whale (SSOT + 해석문)
    ===================================================== */

    const whaleSnapshot = await getWhaleIntensity()
    const whaleIntensity = toNumberSafe(whaleSnapshot?.intensity, 0)

    const whaleInterpretation =
      (await redis.get(WHALE_TEXT_KEY)) ??
      '현재 고래 활동 데이터를 분석 중입니다.'

    /* =====================================================
       4️⃣ Sentiment (SSOT + 해석문)
    ===================================================== */

    const sentimentSnapshot = await getSentimentSnapshot()

    const sentimentIndex = toNumberSafe(sentimentSnapshot?.index, 50)

    const sentimentRegime: 'FEAR' | 'NEUTRAL' | 'GREED' =
      sentimentSnapshot?.regime ?? 'NEUTRAL'

    const sentimentInterpretation =
      (await redis.get(SENTIMENT_TEXT_KEY)) ??
      '현재 시장 심리는 중립 구간입니다.'

    /* =====================================================
       5️⃣ 뉴스 데이터 (Redis: market:context:latest)
    ===================================================== */

    let newsSummary =
      '오늘의 주요 뉴스 데이터가 아직 생성되지 않았습니다.'
    let newsMidLongTerm =
      '구조적 관점에서 변동성 구간을 관찰해야 합니다.'

    try {
      const newsRaw = await redis.get(NEWS_KEY)

      if (newsRaw) {
        const parsed = JSON.parse(newsRaw)
        // contextStore payload 기준: { summary, midLongTerm, ... }
        newsSummary = parsed?.summary ?? newsSummary
        newsMidLongTerm = parsed?.midLongTerm ?? newsMidLongTerm
      }
    } catch (err) {
      console.error('[NEWS PARSE ERROR]', err)
    }

    /* =====================================================
       6️⃣ PDF 생성 (DailyReportInput 최종 구조)
    ===================================================== */

    const pdf = await generateVipDailyReportPdf({
      date: new Date().toISOString().slice(0, 10),
      market: 'BTC',
      vipLevel: 'VIP3',

      // 1️⃣ BTC Snapshot
      btcPrice,
      openInterest,
      fundingRate,
      candleChartBase64,

      // 2️⃣ Whale
      whaleIntensity,
      whaleInterpretation,

      // 3️⃣ Sentiment
      sentimentIndex,
      sentimentRegime,
      sentimentInterpretation,

      // 4️⃣ News
      newsSummary,
      newsMidLongTerm,
    })

    /* =====================================================
       7️⃣ Email
    ===================================================== */

    try {
      await sendVIPReportEmail(email, pdf)
    } catch (err) {
      console.error('[VIP REPORT EMAIL FAILED]', err)
    }

    /* =====================================================
       8️⃣ Telegram
    ===================================================== */

    try {
      const telegramUser = await getTelegramByUserId(userId)

      if (telegramUser?.chatId) {
        await sendVipReportPdf(
          telegramUser.chatId,
          pdf,
          `VIP_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
        )
      }
    } catch (err) {
      console.error('[VIP REPORT TELEGRAM FAILED]', err)
    }
  } catch (error) {
    console.error('[VIP REPORT FATAL ERROR]', error)
  }
}
