import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'

export async function generateTelegramVipReport() {
  const pdfBuffer = await generateVipDailyReportPdf({
    date: new Date().toISOString().slice(0, 10),
    market: 'BTC',
    vipLevel: 'VIP3',

    newsSummary: 'No news summary available',
    newsMidLongTerm: 'No structural outlook available',

    externalOnchainSource: 'Internal Engine',
    externalOnchainSummary: 'No on-chain analysis available',

    fusionTacticalBias: 'Neutral',
    fusionStructuralOutlook: 'No structural data',
    fusionRiskRegime: 'Neutral',
    fusionPositioningPressure: 'No positioning signal',
  })

  return pdfBuffer
}