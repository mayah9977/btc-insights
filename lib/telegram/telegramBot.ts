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
      '🚀 알림 봇이 연결되었습니다.',
    )
  }
})

/** 🔘 콜백 (PDF 재전송) */
bot.on('callback_query', async (query: CallbackQuery) => {
  if (!query.message) return

  const pdfBytes = await generateTelegramVipReport({
    date: new Date().toISOString().slice(0, 10),
    judgement: '시장 리스크 HIGH — EXTREME 회피 권장',
    scenarios: [
      { title: '상승 지속', probability: 45 },
      { title: '조정 후 반등', probability: 35 },
    ],
  })

  await sendVipReportPdf(
    query.message.chat.id,
    pdfBytes,
    'VIP_Report_Today.pdf',
  )
})
