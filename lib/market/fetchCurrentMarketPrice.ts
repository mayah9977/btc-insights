// lib/market/fetchCurrentMarketPrice.ts
export async function fetchCurrentMarketPrice(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
    )
    const json = await res.json()
    const price = Number(json?.price)
    return Number.isFinite(price) ? price : null
  } catch {
    return null
  }
}
