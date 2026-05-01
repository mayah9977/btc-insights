import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getBillingKey, markBillingPaymentFailed, markBillingPaymentSuccess } from '@/lib/toss/tossDB'
import { chargeBillingKey } from '@/lib/toss/tossClient'
import { getVIPPlan, isVIPPlan } from '@/lib/payment/vipPlans'
import {
  applyGracePeriod,
  applyVIPPaymentSuccessByDays,
} from '@/lib/vip/vipDB'
import {
  createPendingPayment,
  markPaymentFailed,
  markPaymentPaid,
} from '@/lib/toss/paymentDB'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  let userId: string | null = null
  let orderId: string | null = null

  try {
    const body = await req.json()

    userId = typeof body.userId === 'string' ? body.userId : null
    const plan = body.plan

    if (!userId || !isVIPPlan(plan)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 },
      )
    }

    const billing = await getBillingKey(userId)

    if (!billing || billing.status === 'CANCELED') {
      return NextResponse.json(
        { error: 'Billing key not found' },
        { status: 400 },
      )
    }

    const config = getVIPPlan(plan)

    orderId = `vip_auto_${userId}_${Date.now()}_${randomUUID()
      .replace(/-/g, '')
      .slice(0, 12)}`

    await createPendingPayment({
      orderId,
      userId,
      plan,
      amount: config.amount,
    })

    const payment = await chargeBillingKey({
      billingKey: billing.billingKey,
      customerKey: billing.customerKey,
      amount: config.amount,
      orderId,
      orderName: config.orderName,
      idempotencyKey: `auto_charge_${orderId}`,
    })

    const applied = await markPaymentPaid({
      orderId,
      paymentKey: payment.paymentKey,
    })

    if (applied) {
      await applyVIPPaymentSuccessByDays({
        userId,
        priceId: plan,
        days: config.days,
      })

      await markBillingPaymentSuccess({
        userId,
        paymentKey: payment.paymentKey,
        orderId,
      })
    }

    logger.info('[TOSS AUTO CHARGE SUCCESS]', {
      userId,
      plan,
      orderId,
      paymentKey: payment.paymentKey,
    })

    return NextResponse.json({
      ok: true,
      orderId,
      paymentKey: payment.paymentKey,
    })
  } catch (error) {
    if (userId) {
      await applyGracePeriod(userId)
      await markBillingPaymentFailed(userId)
    }

    if (orderId) {
      await markPaymentFailed({
        orderId,
        reason:
          error instanceof Error
            ? error.message
            : 'Unknown charge error',
      })
    }

    logger.error('[TOSS AUTO CHARGE FAILED]', {
      userId,
      orderId,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown charge error',
    })

    return NextResponse.json(
      { error: 'Toss charge failed' },
      { status: 500 },
    )
  }
}
