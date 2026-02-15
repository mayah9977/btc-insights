export async function preload30mCloses(
  symbol: string,
  limit = 20,
): Promise<number[]> {
  const url = new URL('https://fapi.binance.com/fapi/v1/klines')

  url.searchParams.set('symbol', symbol)
  url.searchParams.set('interval', '30m')
  url.searchParams.set('limit', String(limit))

  const res = await fetch(url.toString())

  if (!res.ok) {
    throw new Error(`Failed to preload klines: ${res.status}`)
  }

  const data = await res.json()

  // [openTime, open, high, low, close, volume, ...]
  return data.map((k: any) => Number(k[4]))
}
