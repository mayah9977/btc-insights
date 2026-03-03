import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis/server'

export const runtime = 'nodejs'

const TELEGRAM_USERS_KEY = 'vip:telegram:users'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ ok: true })

    const message = body.message
    const callback = body.callback_query

    const chatId =
      message?.chat?.id ?? callback?.message?.chat?.id

    if (!chatId) {
      console.log('[WEBHOOK] ❌ No chatId found')
      return NextResponse.json({ ok: true })
    }

    /* =====================================================
       1️⃣ /start
    ===================================================== */
    if (message?.text === '/start') {

      // 🔥 자동발송 대상 등록
      await redis.sadd(TELEGRAM_USERS_KEY, String(chatId))
      console.log('[WEBHOOK] user added (/start):', chatId)

      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '🚀 VIP 알림 봇이 연결되었습니다.',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '📄 VIP 리포트 받기',
                    callback_data: 'vip_pdf_report',
                  },
                ],
              ],
            },
          }),
        }
      )

      return NextResponse.json({ ok: true })
    }

    /* =====================================================
       2️⃣ 버튼 클릭
    ===================================================== */
    if (callback?.data === 'vip_pdf_report') {

      // 1) ACK
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callback.id,
          }),
        }
      )

      // 2) 중복 방지
      const dedupeKey = `vip:telegram:callback:${callback.id}`
      const setRes = await redis.set(
        dedupeKey,
        '1',
        'EX',
        60,
        'NX'
      )

      if (setRes !== 'OK') {
        console.log('[WEBHOOK] duplicate callback ignored:', callback.id)
        return NextResponse.json({ ok: true })
      }

      // 🔥 자동발송 대상 등록 (보장용)
      await redis.sadd(TELEGRAM_USERS_KEY, String(chatId))
      console.log('[WEBHOOK] user added (button):', chatId)

      // 3) 임시 chatId 저장
      await redis.set(
        'vip:pending:chat',
        String(chatId),
        'EX',
        60 * 5
      )

      // 4) 안내 메시지
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text:
              '⏳ VIP 리포트 요청이 접수되었습니다.\n잠시만 기다려주세요.',
          }),
        }
      )

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[WEBHOOK ERROR]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
