import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const rawSymbol = searchParams.get('symbol')
  const symbol = (rawSymbol || 'BTCUSDT').toUpperCase()

  // 간단한 symbol 검증
  if (!/^[A-Z0-9]{6,20}$/.test(symbol)) {
    return NextResponse.json(
      { ok: false, symbol, error: 'INVALID_SYMBOL' },
      { status: 400 }
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)

  try {
    const res = await fetch(
      `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${encodeURIComponent(
        symbol
      )}`,
      {
        cache: 'no-store',
        signal: controller.signal,
      }
    )

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, symbol, error: `BINANCE_${res.status}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    const price = Number(data?.price)

    if (!Number.isFinite(price)) {
      return NextResponse.json(
        { ok: false, symbol, error: 'INVALID_PRICE' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      ok: true,
      symbol,
      price,
      source: 'BINANCE',
      ts: Date.now(),
    })
  } catch (e: any) {
    const isAbort = e?.name === 'AbortError'
    return NextResponse.json(
      {
        ok: false,
        symbol,
        error: isAbort ? 'UPSTREAM_TIMEOUT' : e?.message || 'UNKNOWN_ERROR',
      },
      { status: isAbort ? 504 : 500 }
    )
  } finally {
    clearTimeout(timeout)
  }
}
