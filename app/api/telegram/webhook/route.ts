// app/api/telegram/webhook/route.ts
import { NextResponse } from 'next/server'
import { sendVipReportPdf } from '@/lib/telegram/sendVipReportPdf'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const message = body.message
  const callback = body.callback_query
  const chatId =
    message?.chat?.id ??
    callback?.message?.chat?.id

  if (!chatId) {
    return NextResponse.json({ ok: true })
  }

  /**
   * Step 1️⃣ /start + 버튼
   */
  if (message?.text === '/start') {
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
   * Step 2️⃣ 버튼 콜백
   */
  if (callback?.data === 'vip_report_redownload') {
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
     * Step 3️⃣ + 4️⃣
     * 👉 VIP 체크 제거
     * 👉 더미 PDF 즉시 전송 (파이프라인 검증)
     */
    void (async () => {
      try {
        const dummyPdf = Buffer.from(
          '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'
        )

        await sendVipReportPdf(
          chatId,
          dummyPdf,
          'TEST_VIP_Report.pdf'
        )

        console.log('[TELEGRAM] dummy pdf sent')
      } catch (err) {
        console.error('[PDF SEND ERROR]', err)
      }
    })()
  }

  return NextResponse.json({ ok: true })
}
