/* =========================================================
   15m Candle Fetcher (Binance Futures)
   - 최근 50개 15분봉
   - BTCUSDT 기본
========================================================= */

export interface Candle15m {
  openTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  closeTime: number
}

const BINANCE_FUTURES =
  'https://fapi.binance.com/fapi/v1/klines'

export async function fetchCandle15m(
  symbol: string = 'BTCUSDT',
  limit: number = 50,
): Promise<Candle15m[]> {
  try {
    const res = await fetch(
      `${BINANCE_FUTURES}?symbol=${symbol}&interval=15m&limit=${limit}`,
      { cache: 'no-store' },
    )

    if (!res.ok) {
      throw new Error(
        `Binance fetch failed: ${res.status}`,
      )
    }

    const data = await res.json()

    return data.map((k: any) => ({
      openTime: Number(k[0]),
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4]),
      volume: Number(k[5]),
      closeTime: Number(k[6]),
    }))
  } catch (err) {
    console.error('[fetchCandle15m] error:', err)
    return []
  }
}
