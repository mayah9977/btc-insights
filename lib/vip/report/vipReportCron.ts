import { generateVipDailyReportPdf } from './vipDailyReportPdf'
import { sendVIPReportEmail } from './vipReportMailer'
import { sendVipReportPdf } from '@/lib/telegram/sendVipReportPdf'

import { redis } from '@/lib/redis/server'

/* 🔥 Onchain */
import { fetchOnchainMultiSource } from '@/lib/onchain/fetchOnchainMultiSource'
import { summarizeExternalOnchain } from '@/lib/onchain/summarizeExternalOnchain'
import { fetchOnchainMetrics } from '@/lib/onchain/fetchOnchainMetrics'
import { summarizeOnchainMetrics } from '@/lib/onchain/summarizeOnchainMetrics'

/* 🔥 Fusion */
import { generateFusionIntel } from '@/lib/vip/fusion/generateFusionIntel'

const NEWS_KEY = 'market:context:latest'
const ONCHAIN_CACHE_KEY = 'vip:onchain:summary'
const TELEGRAM_USERS_KEY = 'vip:telegram:users'

export async function runVIPDailyReport(email: string, userId: string) {
  try {
    /* =====================================================
       1️⃣ News
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
       2️⃣ On-chain Hybrid
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
       3️⃣ Fusion Intelligence
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
       4️⃣ PDF 생성 (최신 구조)
    ===================================================== */

    const pdf = await generateVipDailyReportPdf({
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
       5️⃣ Email
    ===================================================== */

    try {
      await sendVIPReportEmail(email, pdf)
    } catch (err) {
      console.error('[VIP REPORT EMAIL FAILED]', err)
    }

    /* =====================================================
       6️⃣ Telegram (전체 자동발송 구조)
    ===================================================== */

    try {
      const chatIds: string[] =
        await redis.smembers(TELEGRAM_USERS_KEY)

      for (const chatId of chatIds) {
        await sendVipReportPdf(
          Number(chatId),
          pdf,
          `VIP_Report_${new Date()
            .toISOString()
            .slice(0, 10)}.pdf`,
        )
      }
    } catch (err) {
      console.error('[VIP REPORT TELEGRAM FAILED]', err)
    }

  } catch (error) {
    console.error('[VIP REPORT FATAL ERROR]', error)
  }
}