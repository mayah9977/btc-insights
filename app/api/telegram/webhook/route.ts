// app/api/telegram/webhook/route.ts
import { NextResponse } from 'next/server'
import { generateVIPDailyReport } from '@/lib/vip/report/vipDailyReport'
import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'
import { sendVipReportPdf } from '@/lib/telegram/sendVipReportPdf'

export const runtime = 'nodejs'

/** Step 3️⃣ 임시 VIP 판별 (추후 Redis/DB로 교체) */
function isVIP(chatId: number) {
  const VIP_CHAT_IDS = [830227090] // 테스트용
  return VIP_CHAT_IDS.includes(chatId)
}

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
   * =========================
   * Step 1️⃣ /start + 버튼
   * =========================
   */
  if (message?.text === '/start') {
    console.log('[TELEGRAM] /start from', chatId)

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '🚀 알림 봇이 연결되었습니다.\n원하시는 작업을 선택하세요.',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '📄 VIP 리포트 다시 받기',
                  callback_data: 'vip_report_redownload',
                },
              ],
            ],
          },
        }),
      }
    )

    return NextResponse.json({ ok: true })
  }

  /**
   * =========================
   * Step 2️⃣ 버튼 콜백
   * =========================
   */
  if (callback?.data === 'vip_report_redownload') {
    // 먼저 즉시 응답 메시지
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '⏳ 리포트를 준비 중입니다...',
        }),
      }
    )

    /**
     * =========================
     * Step 3️⃣ VIP 분기
     * =========================
     */
    if (!isVIP(chatId)) {
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '❌ VIP 전용 기능입니다.',
          }),
        }
      )
      return NextResponse.json({ ok: true })
    }

    /**
     * =========================
     * Step 4️⃣ VIP → PDF 전송
     * (비동기 처리)
     * =========================
     */
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

  // ✅ Telegram webhook은 항상 즉시 200 OK
  return NextResponse.json({ ok: true })
}
