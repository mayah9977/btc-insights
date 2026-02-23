import { redis } from '@/lib/redis/server'
import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'
import { sendVipReportPdf } from '@/lib/telegram/sendVipReportPdf'

/* 🔥 Multi On-chain (RSS Only) */
import { fetchOnchainMultiList  } from '@/lib/onchain/fetchOnchainMultiList'
import { summarizeExternalOnchain } from '@/lib/onchain/summarizeExternalOnchain'

/* 🔥 Fusion Engine */
import { generateFusionIntel } from '@/lib/vip/fusion/generateFusionIntel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NEWS_KEY = 'market:context:latest'
const ONCHAIN_CACHE_KEY = 'vip:onchain:summary'
const TELEGRAM_USERS_KEY = 'vip:telegram:users'

/* =====================================================
   ✅ KST 날짜 고정
===================================================== */
function getKstDateString(): string {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const kst = new Date(utc + 9 * 60 * 60000)
  return kst.toISOString().slice(0, 10)
}

/* =====================================================
   ✅ 48시간 검증
===================================================== */
function isWithin48Hours(dateString?: string | null): boolean {
  if (!dateString) return false
  const pubDate = new Date(dateString)
  const diffHours =
    (Date.now() - pubDate.getTime()) / (1000 * 60 * 60)
  return diffHours <= 48
}

export async function GET() {
  try {
    console.log('[CRON] 🚀 send-vip-telegram started')

    /* =====================================================
       1️⃣ Telegram 유저 조회
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
       3️⃣ On-chain (🔥 RSS Only 구조)
    ===================================================== */

    let externalOnchainSource = ''
    let externalOnchainSummary = ''

    try {
      const cachedRaw = await redis.get(ONCHAIN_CACHE_KEY)

      let cached: any = null
      let useCache = false

      if (cachedRaw) {
        cached = JSON.parse(cachedRaw)
        if (isWithin48Hours(cached?.pubDate)) {
          useCache = true
        }
      }

      if (useCache && cached) {
        externalOnchainSource = cached.source ?? ''
        externalOnchainSummary = cached.summary ?? ''
      } else {

        const rssItems = await fetchOnchainMultiList()

        if (rssItems && rssItems.length > 0) {

          externalOnchainSummary =
            await summarizeExternalOnchain(rssItems)

          externalOnchainSource =
            `Institutional On-Chain Research (${rssItems.length} reports aggregated)`

          await redis.set(
            ONCHAIN_CACHE_KEY,
            JSON.stringify({
              source: externalOnchainSource,
              summary: externalOnchainSummary,
              pubDate: rssItems[0]?.pubDate ?? null,
            }),
            'EX',
            60 * 60 * 24
          )

        } else {

          externalOnchainSource =
            'Institutional On-Chain Research'

          externalOnchainSummary =
            '최근 48시간 이내의 기관 온체인 보고서를 찾을 수 없습니다.'
        }
      }

    } catch (err) {
      console.error('[ONCHAIN RSS ERROR]', err)
    }

    /* =====================================================
       4️⃣ Fusion
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

    const kstDate = getKstDateString()

    const pdfBytes = await generateVipDailyReportPdf({
      date: kstDate,
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
       6️⃣ Telegram 발송
    ===================================================== */

    let success = 0
    let failed = 0

    for (const chatId of chatIds) {
      try {
        await sendVipReportPdf(
          Number(chatId),
          new Uint8Array(pdfBytes),
          `VIP_Report_${kstDate}.pdf`
        )
        success++
      } catch (err) {
        console.error('[SEND ERROR]', chatId, err)
        failed++
      }
    }

    console.log(
      `[CRON] ✅ Completed — success:${success} failed:${failed}`
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
      { status: 500 }
    )
  }
}