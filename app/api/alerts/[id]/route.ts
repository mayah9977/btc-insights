//app/api/alerts/[id]/route.ts

import { NextResponse } from 'next/server'
import {
  updateAlertForUser,
  deleteAlertForUser,
} from '@/lib/alerts/alertStore.server'
import { handlePriceTick } from '@/lib/alerts/alertEngine'
import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'
import type {
  AlertCondition,
  PriceAlert,
} from '@/lib/alerts/alertTypes'

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
 * PATCH /api/alerts/:id
 * ========================= */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const principal =
      await resolveNotificationPrincipal()

    const { id } = await context.params
    const body = await req.json()

    if (
      body.condition !== undefined &&
      !isPriceCondition(body.condition)
    ) {
      return NextResponse.json(
        {
          error: 'INVALID_PRICE_CONDITION',
        },
        {
          status: 400,
        },
      )
    }

    if (
      body.status !== undefined &&
      body.status !== 'WAITING' &&
      body.status !== 'DISABLED'
    ) {
      return NextResponse.json(
        {
          error: 'INVALID_STATUS',
        },
        {
          status: 400,
        },
      )
    }

    /**
     * ✅ PATCH 허용 필드 (화이트리스트)
     * ✅ status는 WAITING / DISABLED만 허용
     * ❌ id / userId / createdAt 차단
     * ❌ undefined 필드는 기존 값을 지우지 않음
     */
    const patch: Partial<PriceAlert> = {}

    if (
      body.status === 'WAITING' ||
      body.status === 'DISABLED'
    ) {
      patch.status = body.status
    }

    if (body.condition !== undefined) {
      patch.condition = body.condition
    }

    if (
      typeof body.targetPrice === 'number'
    ) {
      patch.targetPrice =
        body.targetPrice
    }

    if (typeof body.percent === 'number') {
      patch.percent = body.percent
    }

    if (
      typeof body.basePrice === 'number'
    ) {
      patch.basePrice = body.basePrice
    }

    if (
      body.repeatMode === 'ONCE' ||
      body.repeatMode === 'REPEAT'
    ) {
      patch.repeatMode = body.repeatMode
    }

    if (
      typeof body.cooldownMs === 'number'
    ) {
      patch.cooldownMs =
        body.cooldownMs
    }

    if (typeof body.memo === 'string') {
      patch.memo = body.memo
    }

    const updated =
      await updateAlertForUser(
        principal.userId,
        id,
        patch,
      )

    if (!updated) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
        },
        {
          status: 404,
        },
      )
    }

    /* =========================
     * 🔥 즉시 평가 (조건 변경 시만)
     * ========================= */
    if (
      patch.condition ||
      typeof patch.targetPrice ===
        'number' ||
      typeof patch.percent === 'number'
    ) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/market/price?symbol=${updated.symbol}`,
          {
            cache: 'no-store',
          },
        )

        if (res.ok) {
          const data = await res.json()

          if (
            data.ok &&
            Number.isFinite(data.price)
          ) {
            await handlePriceTick({
              symbol: updated.symbol,
              price: Number(data.price),
              mode: 'initial',
            })
          }
        }
      } catch (e) {
        console.error(
          '[ALERTS][PATCH][PRICE]',
          e,
        )
      }
    }

    return NextResponse.json(updated)
  } catch (e) {
    console.error(
      '[ALERTS][PATCH] ERROR',
      e,
    )

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
      },
      {
        status: 500,
      },
    )
  }
}

/* =========================
 * DELETE /api/alerts/:id
 * ========================= */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const principal =
      await resolveNotificationPrincipal()

    const { id } = await context.params

    const deleted =
      await deleteAlertForUser(
        principal.userId,
        id,
      )

    if (!deleted) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
        },
        {
          status: 404,
        },
      )
    }

    return NextResponse.json({
      ok: true,
    })
  } catch (e) {
    console.error(
      '[ALERTS][DELETE] ERROR',
      e,
    )

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
      },
      {
        status: 500,
      },
    )
  }
}
