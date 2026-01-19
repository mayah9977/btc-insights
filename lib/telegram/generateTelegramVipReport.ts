import { generateVipDailyReportPdf } from '../vip/report/vipDailyReportPdf.ts'

type TelegramVipReportInput = {
  date: string
  summary: string
}

export async function generateTelegramVipReportPdf(
  input: TelegramVipReportInput
): Promise<Uint8Array> {
  return generateVipDailyReportPdf({
    date: input.date,
    market: 'BTC',
    vipLevel: 'VIP3',
    riskLevel: 'HIGH',
    judgement: input.summary,
    scenarios: [
      {
        title: 'EXTREME 회피',
        probability: 100,
      },
    ],
  })
}
