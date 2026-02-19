// lib/telegram/generateTelegramVipReport.ts

import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'

export async function generateTelegramVipReport(input: {
  chartBase64: string
}) {
  const pdfBuffer = await generateVipDailyReportPdf({
    date: new Date().toISOString().slice(0, 10),
    market: 'BTC',
    vipLevel: 'VIP3',

    btcPrice: 0,
    openInterest: 0,
    fundingRate: 0,
    candleChartBase64: input.chartBase64,

    whaleIntensity: 0,
    whaleInterpretation: 'Whale data unavailable',

    sentimentIndex: 50,
    sentimentRegime: 'NEUTRAL',
    sentimentInterpretation: 'Market sentiment neutral',

    newsSummary: 'No news summary available',
    newsMidLongTerm: 'No structural outlook available',
  })

  return pdfBuffer
}
