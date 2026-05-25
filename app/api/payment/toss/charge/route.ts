//app/api/payment/toss/charge/route.ts  

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

import {
  getBillingKey,
  markBillingPaymentFailed,
  markBillingPaymentSuccess,
} from '@/lib/toss/tossDB'

import { chargeBillingKey } from '@/lib/toss/tossClient'

import {
  getVIPPlan,
  isVIPPlan,
} from '@/lib/payments/vipPlans'

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

export async function POST(
  req: NextRequest,
) {
  let userId: string | null = null

  let orderId: string | null = null

  try {
    const body = await req.json()

    userId =
      typeof body.userId === 'string'
        ? body.userId
        : null

    const plan = body.plan

    if (!userId || !isVIPPlan(plan)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 },
      )
    }

    const billing =
      await getBillingKey(userId)

    if (
      !billing ||
      billing.status === 'CANCELED'
    ) {
      return NextResponse.json(
        { error: 'Billing key not found' },
        { status: 400 },
      )
    }

    /**
     * VIP 플랜 조회
     */
    const config = getVIPPlan(plan)

    /**
     * months → days 변환
     */
    const days = config.months * 30

    orderId = `vip_auto_${userId}_${Date.now()}_${randomUUID()
      .replace(/-/g, '')
      .slice(0, 12)}`

    /**
     * pending payment 생성
     */
    await createPendingPayment({
      orderId,
      userId,
      plan,
      amount: config.amount,
    })

    /**
     * Toss billing charge
     */
    const payment =
      await chargeBillingKey({
        billingKey: billing.billingKey,
        customerKey: billing.customerKey,
        amount: config.amount,
        orderId,
        orderName: config.orderName,
        idempotencyKey: `auto_charge_${orderId}`,
      })

    /**
     * payment success 처리
     */
    const applied =
      await markPaymentPaid({
        orderId,
        paymentKey: payment.paymentKey,
      })

    /**
     * VIP 적용
     */
    if (applied) {
      await applyVIPPaymentSuccessByDays({
        userId,
        priceId: plan,
        days,
      })

      await markBillingPaymentSuccess({
        userId,
        paymentKey: payment.paymentKey,
        orderId,
      })
    }

    logger.info(
      '[TOSS AUTO CHARGE SUCCESS]',
      {
        userId,
        plan,
        days,
        orderId,
        paymentKey: payment.paymentKey,
      },
    )

    return NextResponse.json({
      ok: true,
      orderId,
      paymentKey: payment.paymentKey,
      days,
    })
  } catch (error) {
    /**
     * grace period 적용
     */
    if (userId) {
      await applyGracePeriod(userId)

      await markBillingPaymentFailed(
        userId,
      )
    }

    /**
     * payment failed 처리
     */
    if (orderId) {
      await markPaymentFailed({
        orderId,
        reason:
          error instanceof Error
            ? error.message
            : 'Unknown charge error',
      })
    }

    logger.error(
      '[TOSS AUTO CHARGE FAILED]',
      {
        userId,
        orderId,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown charge error',
      },
    )

    return NextResponse.json(
      { error: 'Toss charge failed' },
      { status: 500 },
    )
  }
}
