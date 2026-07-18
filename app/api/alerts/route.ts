//app/api/alerts/route.ts

import { NextResponse } from 'next/server'
import {
  createAlert,
  listAlerts,
} from '@/lib/alerts/alertStore.server'
import { forceEvaluatePrice } from '@/lib/market/pricePolling'
import { fetchCurrentMarketPrice } from '@/lib/market/fetchCurrentMarketPrice'
import type { AlertCondition } from '@/lib/alerts/alertTypes'
import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'

const PRICE_CONDITIONS = new Set<AlertCondition>([
  'ABOVE',
  'BELOW',
  'REACH',
  'PERCENT_UP',
  'PERCENT_DOWN',
])

function isPriceCondition(
  value: unknown,
): value is AlertCondition {
  return (
    typeof value === 'string' &&
    PRICE_CONDITIONS.has(
      value as AlertCondition,
    )
  )
}

/* =========================
 * GET /api/alerts
 * ========================= */
export async function GET() {
  try {
    const principal =
      await resolveNotificationPrincipal()

    const alerts = await listAlerts(
      principal.userId,
    )

    return NextResponse.json({
      ok: true,
      alerts,
    })
  } catch (e) {
    console.error('[ALERTS][GET]', e)

    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
      },
      {
        status: 500,
      },
    )
  }
}

/* =========================
 * POST /api/alerts
 * ========================= */
export async function POST(req: Request) {
  try {
    const principal =
      await resolveNotificationPrincipal()

    const body = await req.json()

    const symbol =
      typeof body.symbol === 'string'
        ? body.symbol.trim().toUpperCase()
        : ''

    if (!symbol) {
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_SYMBOL',
        },
        {
          status: 400,
        },
      )
    }

    if (!isPriceCondition(body.condition)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_PRICE_CONDITION',
        },
        {
          status: 400,
        },
      )
    }

    if (
      principal.kind === 'anonymous' &&
      symbol !== 'BTCUSDT'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'ANONYMOUS_BTC_ONLY',
        },
        {
          status: 403,
        },
      )
    }

    const condition = body.condition

    const isPercent =
      condition === 'PERCENT_UP' ||
      condition === 'PERCENT_DOWN'

    /**
     * 🔥 basePrice는 서버에서 fetch로만 결정
     */
    let basePrice: number | undefined =
      undefined

    if (isPercent) {
      const fetched =
        await fetchCurrentMarketPrice(
          symbol,
        )

      if (
        typeof fetched === 'number' &&
        Number.isFinite(fetched)
      ) {
        basePrice = fetched
      }
    }

    // 1️⃣ 알림 생성
    const alert = await createAlert({
      userId: principal.userId,
      exchange: 'BINANCE',
      symbol,
      condition,

      // 절대값 조건
      targetPrice:
        condition === 'ABOVE' ||
        condition === 'BELOW' ||
        condition === 'REACH'
          ? body.targetPrice
          : undefined,

      // 퍼센트 조건
      basePrice,
      percent: isPercent
        ? body.percent
        : undefined,

      repeatMode:
        body.repeatMode ?? 'ONCE',
    })

    // 2️⃣ 생성 직후 즉시 1회 평가
    await forceEvaluatePrice({
      symbol: alert.symbol,
    })

    return NextResponse.json({
      ok: true,
      alert,
    })
  } catch (e: any) {
    console.error('[ALERTS][POST]', e)

    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: e?.message,
      },
      {
        status: 500,
      },
    )
  }
}
