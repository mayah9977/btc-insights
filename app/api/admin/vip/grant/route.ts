import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getVIPPlan, isVIPPlan } from '@/lib/payment/vipPlans'
import { applyVIPPaymentSuccessByDays } from '@/lib/vip/vipDB'
import { createPendingPayment, markPaymentPaid } from '@/lib/toss/paymentDB'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const adminSecret = process.env.ADMIN_API_SECRET

  if (!adminSecret || auth !== `Bearer ${adminSecret}`) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 },
    )
  }

  try {
    const body = await req.json()

    const userId = typeof body.userId === 'string' ? body.userId : null
    const plan = body.plan

    if (!userId || !isVIPPlan(plan)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 },
      )
    }

    const config = getVIPPlan(plan)
    const orderId = `admin_vip_${userId}_${Date.now()}_${randomUUID()
      .replace(/-/g, '')
      .slice(0, 12)}`

    await createPendingPayment({
      orderId,
      userId,
      plan: 'ADMIN',
      amount: 0,
    })

    const applied = await markPaymentPaid({
      orderId,
      paymentKey: `ADMIN_${orderId}`,
    })

    if (applied) {
      await applyVIPPaymentSuccessByDays({
        userId,
        priceId: `ADMIN_${plan}`,
        days: config.days,
      })
    }

    logger.info('[ADMIN VIP GRANT SUCCESS]', {
      userId,
      plan,
      days: config.days,
      orderId,
    })

    return NextResponse.json({
      ok: true,
      userId,
      plan,
      days: config.days,
    })
  } catch (error) {
    logger.error('[ADMIN VIP GRANT FAILED]', {
      error:
        error instanceof Error
          ? error.message
          : 'Unknown admin VIP grant error',
    })

    return NextResponse.json(
      { error: 'Admin VIP grant failed' },
      { status: 500 },
    )
  }
}
