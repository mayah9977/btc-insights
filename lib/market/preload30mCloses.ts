export async function preload30mCloses(
  symbol: string,
  limit = 50, // ✅ MACD 계산 안정성 확보
): Promise<number[]> {

  // 🔥 MACD 최소 요구치 보장 (26 + 9 = 35 이상)
  const safeLimit = Math.max(limit, 50)

  const url = new URL('https://fapi.binance.com/fapi/v1/klines')

  url.searchParams.set('symbol', symbol.toUpperCase())
  url.searchParams.set('interval', '30m')
  url.searchParams.set('limit', String(safeLimit))

  const res = await fetch(url.toString(), {
    cache: 'no-store', // 🔥 실시간 데이터 보장
  })

  if (!res.ok) {
    throw new Error(
      `Failed to preload klines: ${res.status} ${res.statusText}`,
    )
  }

  const data = await res.json()

  if (!Array.isArray(data)) {
    throw new Error('Invalid kline response format')
  }

  // [openTime, open, high, low, close, volume, ...]
  return data
    .map((k: any) => Number(k?.[4]))
    .filter((v: number) => Number.isFinite(v))
}
