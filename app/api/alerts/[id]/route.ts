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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await req.json()

    const updated = await updateAlert(id, body)

    if (!updated) {
      return NextResponse.json(
        { error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    /* 🔥 즉시 평가 */
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/market/price?symbol=${updated.symbol}`,
        { cache: 'no-store' }
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

    return NextResponse.json(updated)
  } catch (e: any) {
    console.error('[ALERTS][PATCH] ERROR', e)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/* =========================
 * DELETE /api/alerts/:id
 * ========================= */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  // deleteAlert는 void 반환 → 성공/실패 체크 ❌
  await deleteAlert(id)

  return NextResponse.json({ ok: true })
}
