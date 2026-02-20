export async function sendVipReportPdf(
  chatId: number,
  pdf: Uint8Array,
  filename: string
) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN')

  const form = new FormData()

  form.append('chat_id', String(chatId))

  // ✅ Uint8Array → Node Buffer 변환 (가장 안정적)
  const fileBuffer = Buffer.from(pdf)

  form.append('document', fileBuffer as any, filename)

  form.append(
    'reply_markup',
    JSON.stringify({
      inline_keyboard: [
        [
          {
            text: '📄 리포트 다시 받기',
            callback_data: 'vip_report_redownload',
          },
        ],
      ],
    })
  )

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendDocument`,
    {
      method: 'POST',
      body: form as any,
    }
  )

  if (!res.ok) {
    const errorText = await res.text()
    console.error('[Telegram SEND ERROR]', errorText)
    throw new Error(errorText)
  }

  console.log('[Telegram] PDF sent:', chatId)
}