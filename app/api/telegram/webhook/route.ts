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
    console.log('[VIP TEST] async start')

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ 비동기 작업 진입 성공 (PDF 생성 전)',
        }),
      }
    )

    // ⛔️ PDF 로직은 잠시 주석
    // const report = await generateVIPDailyReport()
    // ...
  } catch (err) {
    console.error('[VIP REPORT ERROR]', err)
  }
})()}}