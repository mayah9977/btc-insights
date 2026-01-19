import FormData from 'form-data'

export async function sendVipReportPdf(
  chatId: number,
  pdf: Uint8Array,
  filename: string
) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN')

  const form = new FormData()
  form.append('chat_id', String(chatId))
  form.append('document', Buffer.from(pdf), {
    filename,
    contentType: 'application/pdf',
  })
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
    throw new Error(await res.text())
  }
}
