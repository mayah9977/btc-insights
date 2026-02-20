export async function sendVipReportPdf(
  chatId: number,
  pdf: Uint8Array,
  filename: string
) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN')

  /* =========================================
     1️⃣ multipart boundary 생성
  ========================================= */
  const boundary = '----TelegramBoundary' + Date.now()

  /* =========================================
     2️⃣ multipart header 구성
  ========================================= */
  const header =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
    `${chatId}\r\n` +

    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="document"; filename="${filename}"\r\n` +
    `Content-Type: application/pdf\r\n\r\n`

  const footer = `\r\n--${boundary}--\r\n`

  /* =========================================
     3️⃣ Buffer로 최종 body 구성
  ========================================= */
  const body = Buffer.concat([
    Buffer.from(header, 'utf8'),
    Buffer.from(pdf),
    Buffer.from(footer, 'utf8'),
  ])

  /* =========================================
     4️⃣ Telegram API 호출
  ========================================= */
  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendDocument`,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    }
  )

  if (!res.ok) {
    const errorText = await res.text()
    console.error('[Telegram SEND ERROR]', errorText)
    throw new Error(errorText)
  }

  console.log('[Telegram] PDF sent:', chatId)
}