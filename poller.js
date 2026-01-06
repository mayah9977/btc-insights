// poller.js
const TARGET = 'https://btc-insights.vercel.app/api/cron/price-poll'
const INTERVAL = 5000 // 5초

if (!process.env.CRON_SECRET) {
  console.error('❌ CRON_SECRET is not set')
  process.exit(1)
}

console.log('🚀 BTC Price Poller started (5s interval)')
console.log('🎯 Target:', TARGET)

async function poll() {
  try {
    const res = await fetch(TARGET, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET,
      },
    })

    if (!res.ok) {
      console.error('❌ Poll failed:', res.status)
      return
    }

    const data = await res.json()
    console.log('✅ Poll success:', data)
  } catch (e) {
    console.error('❌ Poll error:', e.message)
  }
}

setInterval(poll, INTERVAL)
