import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'

export async function generateTelegramVipReport(
  input: {
    date: string
    judgement: string
    scenarios: { title: string; probability: number }[]
  },
): Promise<Uint8Array> {
  const pdfBytes = await generateVipDailyReportPdf({
    date: input.date,
    market: 'BTC',
    vipLevel: 'VIP3',
    riskLevel: 'HIGH',
    judgement: input.judgement,
    scenarios: input.scenarios,

    // ✅ 필수 추가 (서버용 placeholder)
    chartBase64: 'data:image/png;base64,',
  })

  return new Uint8Array(pdfBytes)
}
