import { generateVIPDailyReport } from './vipDailyReport'
import { generateVipDailyReportPdf } from './vipDailyReportPdf'
import { sendVIPReportEmail } from './vipReportMailer'
import { sendVipReportPdf } from '@/lib/telegram/sendVipReportPdf'
import { getTelegramByUserId } from '@/lib/telegram/telegramStore'

export async function runVIPDailyReport(
  email: string,
  userId: string
) {
  // 1️⃣ 데이터 생성
  const report = await generateVIPDailyReport()
  if (!report) return

  // 2️⃣ PDF 생성
  const pdf = await generateVipDailyReportPdf({
    date: report.generatedAt.slice(0, 10),
    market: 'BTC',
    vipLevel: 'VIP3',
    riskLevel: 'HIGH',

    // ✅ summary 기반 judgement 구성
    judgement: report.summary,

    // ✅ cron에서는 시나리오 없음
    scenarios: [],

    // ✅ 서버/cron placeholder
    chartBase64: 'data:image/png;base64,',
  })

  // 3️⃣ 이메일 전송
  try {
    await sendVIPReportEmail(email, Buffer.from(pdf))
  } catch (err) {
    console.error('[VIP REPORT EMAIL FAILED]', err)
  }

  // 4️⃣ Telegram 전송 (연결된 경우만)
  try {
    const telegramUser = await getTelegramByUserId(userId)
    if (telegramUser?.chatId) {
      await sendVipReportPdf(
        telegramUser.chatId,
        pdf,
        `VIP_Report_${report.generatedAt.slice(0, 10)}.pdf`
      )
    }
  } catch (err) {
    console.error('[VIP REPORT TELEGRAM FAILED]', err)
  }
}
