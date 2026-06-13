// app/api/market/realtime-fallback/route.ts

import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RealtimeFallbackResponse = {
  ok: boolean
  source: 'BINANCE_FUTURES_REST'
  symbol: string
  ts: number
  data: {
    price?: number
    oi?: number
    fundingRate?: number
  }
  error?: string
}

const BINANCE_REST_WARN_THROTTLE_MS = 30000

const lastBinanceRestWarnAt =
  new Map<string, number>()

function toNumber(value: unknown): number | undefined {
  const n = Number(value)

  return Number.isFinite(n) ? n : undefined
}

function warnBinanceRestFailure(
  key: string,
  error: unknown,
) {
  const now = Date.now()
  const last =
    lastBinanceRestWarnAt.get(key) ?? 0

  if (
    now - last <
    BINANCE_REST_WARN_THROTTLE_MS
  ) {
    return
  }

  lastBinanceRestWarnAt.set(key, now)

  console.warn('[BINANCE_REST_FALLBACK_FAILED]', {
    key,
    message:
      error instanceof Error
        ? error.message
        : String(error),
    ts: now,
  })
}

async function readJsonFromSettled(
  key: string,
  result: PromiseSettledResult<Response>,
) {
  if (result.status === 'rejected') {
    warnBinanceRestFailure(
      key,
      result.reason,
    )

    return null
  }

  if (!result.value.ok) {
    warnBinanceRestFailure(
      key,
      new Error(
        `HTTP ${result.value.status} ${result.value.statusText}`,
      ),
    )

    return null
  }

  try {
    return await result.value.json()
  } catch (error) {
    warnBinanceRestFailure(key, error)

    return null
  }
}

export async function GET(req: NextRequest) {
  const symbol =
    req.nextUrl.searchParams
      .get('symbol')
      ?.toUpperCase() || 'BTCUSDT'

  try {
    const [priceRes, oiRes, fundingRes] =
      await Promise.allSettled([
        fetch(
          `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`,
          { cache: 'no-store' },
        ),
        fetch(
          `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`,
          { cache: 'no-store' },
        ),
        fetch(
          `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`,
          { cache: 'no-store' },
        ),
      ])

    const priceJson =
      await readJsonFromSettled(
        'price',
        priceRes,
      )

    const oiJson =
      await readJsonFromSettled(
        'openInterest',
        oiRes,
      )

    const fundingJson =
      await readJsonFromSettled(
        'premiumIndex',
        fundingRes,
      )

    const price = toNumber(priceJson?.price)
    const oi = toNumber(oiJson?.openInterest)
    const fundingRate = toNumber(
      fundingJson?.lastFundingRate,
    )

    const body: RealtimeFallbackResponse = {
      ok: true,
      source: 'BINANCE_FUTURES_REST',
      symbol,
      ts: Date.now(),
      data: {
        ...(price !== undefined && { price }),
        ...(oi !== undefined && { oi }),
        ...(fundingRate !== undefined && {
          fundingRate,
        }),
      },
    }

    return Response.json(body, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    const body: RealtimeFallbackResponse = {
      ok: false,
      source: 'BINANCE_FUTURES_REST',
      symbol,
      ts: Date.now(),
      data: {},
      error:
        error?.message ?? 'unknown error',
    }

    return Response.json(body, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  }
}
