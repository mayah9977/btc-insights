import { handlePriceTick } from '../lib/poller/alertEngine.poller.js'

const SYMBOLS = ['BTCUSDT', 'ETHUSDT']

async function poll() {
  for (const symbol of SYMBOLS) {
    try {
      const r = await fetch(
        `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`
      )

      if (!r.ok) continue

      const data = await r.json()
      const price = Number(data.price)

      if (!Number.isFinite(price)) continue

      await handlePriceTick({
        symbol,
        price,
      })
    } catch (e) {
      console.error('[WORKER][PRICE]', symbol, e)
    }
  }
}

setInterval(poll, 5_000)
