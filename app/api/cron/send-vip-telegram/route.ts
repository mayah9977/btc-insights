import { redis } from '@/lib/redis/server'
import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'
import { sendVipReportPdf } from '@/lib/telegram/sendVipReportPdf'

/* 🔥 Multi On-chain */
import { fetchOnchainMultiSource } from '@/lib/onchain/fetchOnchainMultiSource'
import { summarizeExternalOnchain } from '@/lib/onchain/summarizeExternalOnchain'

/* 🔥 Metrics Engine */
import { fetchOnchainMetrics } from '@/lib/onchain/fetchOnchainMetrics'
import { summarizeOnchainMetrics } from '@/lib/onchain/summarizeOnchainMetrics'

/* 🔥 Fusion Engine */
import { generateFusionIntel } from '@/lib/vip/fusion/generateFusionIntel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NEWS_KEY = 'market:context:latest'
const ONCHAIN_CACHE_KEY = 'vip:onchain:summary'
const TELEGRAM_USERS_KEY = 'vip:telegram:users'

export async function GET() {
  try {
    console.log('[CRON] 🚀 send-vip-telegram started')

    /* =====================================================
       1️⃣ Telegram VIP 유저 목록 조회
    ===================================================== */

    const chatIds: string[] = await redis.smembers(TELEGRAM_USERS_KEY)

    if (!chatIds || chatIds.length === 0) {
      console.log('[CRON] ❌ No telegram users found')
      return Response.json({ ok: false, message: 'No telegram users' })
    }

    console.log(`[CRON] 👥 ${chatIds.length} users found`)

    /* =====================================================
       2️⃣ News
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
      console.error('[NEWS ERROR]', err)
    }

    /* =====================================================
       3️⃣ On-chain Hybrid
    ===================================================== */

    let externalOnchainSource = ''
    let externalOnchainSummary = ''

    try {
      const cached = await redis.get(ONCHAIN_CACHE_KEY)

      if (cached) {
        const parsed = JSON.parse(cached)
        externalOnchainSource = parsed.source ?? ''
        externalOnchainSummary = parsed.summary ?? ''
      } else {
        const rssItem = await fetchOnchainMultiSource()

        let useRss = false

        if (rssItem?.pubDate) {
          const pubDate = new Date(rssItem.pubDate)
          const diffHours =
            (Date.now() - pubDate.getTime()) / (1000 * 60 * 60)

          if (diffHours <= 48) useRss = true
        }

        if (useRss && rssItem) {
          externalOnchainSource =
            `${rssItem.source} (${rssItem.pubDate})`
          externalOnchainSummary =
            await summarizeExternalOnchain(rssItem)
        } else {
          externalOnchainSource =
            'Internal On-Chain Metrics Engine (Daily Snapshot)'

          const metrics = await fetchOnchainMetrics()
          externalOnchainSummary =
            await summarizeOnchainMetrics(metrics)
        }

        await redis.set(
          ONCHAIN_CACHE_KEY,
          JSON.stringify({
            source: externalOnchainSource,
            summary: externalOnchainSummary,
          }),
          'EX',
          60 * 60 * 24,
        )
      }
    } catch (err) {
      console.error('[ONCHAIN ERROR]', err)
    }

    /* =====================================================
       4️⃣ Fusion Intelligence
    ===================================================== */

    const fusion = await generateFusionIntel({
      newsSummary,
      newsMidLongTerm,
      onchainSummary: externalOnchainSummary,
      whaleIntensity: 0,
      fundingRate: 0,
      openInterest: 0,
      sentimentRegime: 'NEUTRAL',
    })

    /* =====================================================
       5️⃣ PDF 생성
    ===================================================== */

    const pdfBytes = await generateVipDailyReportPdf({
      date: new Date().toISOString().slice(0, 10),
      market: 'BTC',
      vipLevel: 'VIP3',

      newsSummary,
      newsMidLongTerm,

      externalOnchainSource,
      externalOnchainSummary,

      fusionTacticalBias: fusion.tacticalBias,
      fusionStructuralOutlook: fusion.structuralOutlook,
      fusionRiskRegime: fusion.riskRegime,
      fusionPositioningPressure: fusion.positioningPressure,
    })

    /* =====================================================
       6️⃣ 전체 Telegram 발송
    ===================================================== */

    let success = 0
    let failed = 0

    for (const chatId of chatIds) {
      try {
        await sendVipReportPdf(
          Number(chatId),
          new Uint8Array(pdfBytes),
          `VIP_Report_${Date.now()}.pdf`,
        )
        success++
      } catch (err) {
        console.error('[SEND ERROR]', chatId, err)
        failed++
      }
    }

    console.log(
      `[CRON] ✅ Completed — success:${success} failed:${failed}`,
    )

    return Response.json({
      ok: true,
      total: chatIds.length,
      success,
      failed,
    })

  } catch (err: any) {
    console.error('[CRON FATAL ERROR]', err)

    return Response.json(
      { ok: false, error: err?.message ?? 'unknown error' },
      { status: 500 },
    )
  }
}