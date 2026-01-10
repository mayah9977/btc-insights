import { NextResponse } from 'next/server'
import {
  updateAlert,
  deleteAlert,
} from '@/lib/alerts/alertStore.server'
import { handlePriceTick } from '@/lib/alerts/alertEngine'

/* =========================
 * PATCH /api/alerts/:id
 * ========================= */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body = await req.json()

    /**
     * ✅ PATCH 허용 필드 (화이트리스트)
     * ❌ status / lastTriggeredAt / createdAt 차단
     */
    const patch = {
      condition: body.condition,
      targetPrice: body.targetPrice,
      percent: body.percent,
      basePrice: body.basePrice,
      repeatMode: body.repeatMode,
      cooldownMs: body.cooldownMs,
      memo: body.memo,
    }

    const updated = await updateAlert(id, patch)

    if (!updated) {
      return NextResponse.json(
        { error: 'NOT_FOUND' },
        { status: 404 },
      )
    }

    /* =========================
     * 🔥 즉시 평가 (조건 변경 시만)
     * ========================= */
    if (
      patch.condition ||
      typeof patch.targetPrice === 'number' ||
      typeof patch.percent === 'number'
    ) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/market/price?symbol=${updated.symbol}`,
          { cache: 'no-store' },
        )

        if (res.ok) {
          const data = await res.json()
          if (data.ok && Number.isFinite(data.price)) {
            await handlePriceTick({
              symbol: updated.symbol,
              price: Number(data.price),
              mode: 'initial',
            })
          }
        }
      } catch (e) {
        console.error('[ALERTS][PATCH][PRICE]', e)
      }
    }

    return NextResponse.json(updated)
  } catch (e) {
    console.error('[ALERTS][PATCH] ERROR', e)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 },
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
  const { id } = await context.params

  await deleteAlert(id)

  return NextResponse.json({ ok: true })
}
