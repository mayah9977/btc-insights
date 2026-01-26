import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: true })

  const message = body.message
  const callback = body.callback_query

  const chatId = message?.chat?.id ?? callback?.message?.chat?.id
  if (!chatId) return NextResponse.json({ ok: true })

  // /start
  if (message?.text === '/start') {
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
              [{ text: '📄 VIP 리포트 받기', callback_data: 'vip_pdf_report' }],
            ],
          },
        }),
      }
    )
    return NextResponse.json({ ok: true })
  }

  // 버튼 클릭 → 요청 접수만
  if (callback?.data === 'vip_pdf_report') {
    // 1) ACK
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callback.id }),
      }
    )

    // 2) ✅ 중복 방지 (SET NX EX)
    const dedupeKey = `vip:telegram:callback:${callback.id}`
    const setRes = await redis.set(dedupeKey, '1', 'EX', 60, 'NX')
    // ioredis: NX 실패 시 null 반환
    if (setRes !== 'OK') return NextResponse.json({ ok: true })

    // 3) ✅ chatId 저장 (5분 TTL)
    await redis.set('vip:pending:chat', String(chatId), 'EX', 60 * 5)

    // 4) 안내
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '⏳ VIP 리포트 요청이 접수되었습니다.\n잠시만 기다려주세요.',
        }),
      }
    )

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
