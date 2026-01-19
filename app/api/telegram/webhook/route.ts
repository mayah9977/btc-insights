// app/api/telegram/webhook/route.ts
import { NextResponse } from 'next/server'
import { generateVIPDailyReport } from '@/lib/vip/report/vipDailyReport'
import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'
import { sendVipReportPdf } from '@/lib/telegram/sendVipReportPdf'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  let body: any

  try {
    body = await req.json()
  } catch {
    // JSON 깨진 경우도 무조건 OK
    return NextResponse.json({ ok: true })
  }

  console.log('[TELEGRAM WEBHOOK]', JSON.stringify(body, null, 2))

  const message = body.message
  const callback = body.callback_query

  const chatId =
    message?.chat?.id ??
    callback?.message?.chat?.id

  if (!chatId) {
    return NextResponse.json({ ok: true })
  }

  /**
   * ✅ /start 명령
   */
  if (message?.text === '/start') {
    // 👉 여기서 환영 메시지 or 버튼 전송 가능
    console.log('[TELEGRAM] /start from', chatId)

    return NextResponse.json({ ok: true })
  }

  /**
   * 📄 VIP 리포트 재다운로드 버튼
   */
  if (callback?.data === 'vip_report_redownload') {
    // ⛔ webhook은 빨리 응답하고
    // ⛔ 실제 작업은 비동기로
    void (async () => {
      try {
        const report = await generateVIPDailyReport()
        if (!report) return

        const pdf = await generateVipDailyReportPdf({
          date: report.generatedAt.slice(0, 10),
          market: 'BTC',
          vipLevel: 'VIP3',
          riskLevel: 'HIGH',
          judgement: report.summary,
          scenarios: [
            { title: 'EXTREME 회피', probability: 100 },
          ],
        })

        await sendVipReportPdf(
          chatId,
          pdf,
          `VIP_Report_${report.generatedAt.slice(0, 10)}.pdf`
        )
      } catch (err) {
        console.error('[VIP REPORT ERROR]', err)
      }
    })()
  }

  // ✅ Telegram webhook은 항상 200 OK
  return NextResponse.json({ ok: true })
}
