import FormData from 'form-data'

export async function sendVipReportPdf(
  chatId: number,
  pdf: Uint8Array,
  filename: string
) {
  /* ===============================
     1️⃣ Token 검증
  =============================== */
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error('[Telegram] Missing TELEGRAM_BOT_TOKEN')
    throw new Error('Missing TELEGRAM_BOT_TOKEN')
  }

  /* ===============================
     2️⃣ FormData 구성
  =============================== */
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

  /* ===============================
     3️⃣ Telegram API 호출
  =============================== */
  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendDocument`,
    {
      method: 'POST',
      body: form as any,
    }
  )

  /* ===============================
     4️⃣ 실패 시 상세 로그 출력
  =============================== */
  if (!res.ok) {
    const errorText = await res.text()
    console.error('[Telegram SEND ERROR]', errorText)
    throw new Error(errorText)
  }

  console.log('[Telegram] PDF sent to:', chatId)
}