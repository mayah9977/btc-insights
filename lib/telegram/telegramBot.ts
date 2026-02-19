// lib/telegram/telegramBot.ts

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import TelegramBot, { Message, CallbackQuery } from 'node-telegram-bot-api'
import { generateTelegramVipReport } from './generateTelegramVipReport'
import { sendVipReportPdf } from './sendVipReportPdf'

/**
 * =====================================================
 * Telegram Bot Entry (Node / Worker 전용)
 * 실행:
 *   npx tsx lib/telegram/telegramBot.ts
 * =====================================================
 */

const token = process.env.TELEGRAM_BOT_TOKEN

if (!token) {
  console.error('[Telegram] ❌ TELEGRAM_BOT_TOKEN is undefined')
  process.exit(1)
}

/** 🤖 Bot 생성 (Polling) */
const bot = new TelegramBot(token, { polling: true })
console.log('[Telegram] 🤖 Bot polling started')

/** 📩 기본 메시지 */
bot.on('message', async (msg: Message) => {
  console.log('[Telegram] 📩 message:', msg.chat.id, msg.text)

  if (msg.text === '/start') {
    await bot.sendMessage(
      msg.chat.id,
      '🚀 VIP 리포트 봇이 연결되었습니다.',
    )
  }
})

/** 🔘 콜백 (PDF 생성 & 전송) */
bot.on('callback_query', async (query: CallbackQuery) => {
  if (!query.message) return

  try {
    console.log('[Telegram] 🔘 Callback received')

    /**
     * ✅ 최신 구조 기준
     * generateTelegramVipReport는 chartBase64만 받음
     * (현재는 placeholder 이미지 사용)
     */
    const pdfBytes = await generateTelegramVipReport({
      chartBase64:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ajmR6cAAAAASUVORK5CYII=',
    })

    await sendVipReportPdf(
      query.message.chat.id,
      pdfBytes,
      'VIP_Report_Today.pdf',
    )

    console.log('[Telegram] ✅ PDF sent')
  } catch (err) {
    console.error('[Telegram] ❌ PDF send error:', err)
  }
})
