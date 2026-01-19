import 'dotenv/config'

// Node 18 미만 대비 (tsx/pm2 환경 안전)
import fetch from 'node-fetch'

const token = process.env.TELEGRAM_BOT_TOKEN
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL
const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET

if (!token) throw new Error('❌ TELEGRAM_BOT_TOKEN is missing')
if (!webhookUrl) throw new Error('❌ TELEGRAM_WEBHOOK_URL is missing')

async function setWebhook() {
  console.log('[setWebhook] URL:', webhookUrl)

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,

        // ✅ polling 잔여 update 제거 (409 Conflict 방지)
        drop_pending_updates: true,

        // ✅ 보안 (있으면 자동 적용)
        ...(secretToken
          ? { secret_token: secretToken }
          : {}),
      }),
    }
  )

  const data = await res.json()
  console.log('[setWebhook result]', data)
}

setWebhook()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ setWebhook failed', err)
    process.exit(1)
  })
