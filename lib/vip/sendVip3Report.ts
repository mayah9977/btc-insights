type Channel = 'EMAIL' | 'TELEGRAM'

type SendPayload = {
  userId: string
  email?: string
  telegramChatId?: string
  pdfUrl: string
}

export function sendVip3Report(
  channel: Channel,
  payload: SendPayload
) {
  if (channel === 'EMAIL') {
    // 실제 구현 시 SendGrid / SES
    console.log('[VIP3 EMAIL]', {
      to: payload.email,
      pdf: payload.pdfUrl,
    })
  }

  if (channel === 'TELEGRAM') {
    // 실제 구현 시 Telegram Bot API
    console.log('[VIP3 TELEGRAM]', {
      chatId: payload.telegramChatId,
      pdf: payload.pdfUrl,
    })
  }

  return { ok: true }
}
