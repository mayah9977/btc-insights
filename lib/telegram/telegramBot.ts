//lib/telegram/telegramBot.ts

import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

import TelegramBot, {
  Message,
  CallbackQuery,
} from 'node-telegram-bot-api'

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
  console.error(
    '[Telegram] ❌ TELEGRAM_BOT_TOKEN is undefined'
  )
  process.exit(1)
}

/**
 * =====================================================
 * ✅ Production Guard
 * - Production 환경에서는 polling 금지
 * - Webhook route를 authoritative path로 유지
 * =====================================================
 */

if (process.env.NODE_ENV === 'production') {
  console.warn(
    '[Telegram] ⚠️ Polling bot is disabled in production. Webhook route is authoritative.'
  )

  process.exit(0)
}

/** 🤖 Bot 생성 (Polling / Local Dev 전용) */
const bot = new TelegramBot(token, {
  polling: true,
})

console.log(
  '[Telegram] 🤖 Bot polling started (local/dev only)'
)

/** 📩 기본 메시지 */
bot.on('message', async (msg: Message) => {
  console.log(
    '[Telegram] 📩 message:',
    msg.chat.id,
    msg.text
  )

  if (msg.text === '/start') {
    await bot.sendMessage(
      msg.chat.id,
      '🚀 VIP 리포트 봇이 연결되었습니다.',
    )
  }
})

/** 🔘 콜백 (PDF 생성 & 전송) */
bot.on(
  'callback_query',
  async (query: CallbackQuery) => {
    if (!query.message) return

    try {
      console.log(
        '[Telegram] 🔘 Callback received'
      )

      // ✅ 최신 구조: 인자 없이 호출
      const pdfBytes =
        await generateTelegramVipReport()

      await sendVipReportPdf(
        query.message.chat.id,
        pdfBytes,
        'VIP_Report_Today.pdf',
      )

      console.log('[Telegram] ✅ PDF sent')
    } catch (err) {
      console.error(
        '[Telegram] ❌ PDF send error:',
        err
      )
    }
  },
)
