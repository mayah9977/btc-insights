//app/api/payment/toss/confirm/route.ts  

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'

import {
  issueBillingKey,
  chargeBillingKey,
} from '@/lib/toss/tossClient'

import {
  saveBillingKey,
  markBillingPaymentSuccess,
} from '@/lib/toss/tossDB'

import {
  getPaymentByOrderId,
  markPaymentFailed,
  markPaymentPaid,
} from '@/lib/toss/paymentDB'

import {
  getVIPPlan,
  isVIPPlan,
} from '@/lib/payments/vipPlans'

import {
  applyVIPPaymentSuccessByDays,
} from '@/lib/vip/vipDB'

import { logger } from '@/lib/logger'

export async function POST(
  req: NextRequest,
) {
  let orderId: string | null = null

  try {
    /**
     * 최신 auth 구조
     */
    const user =
      await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 },
      )
    }

    const body = await req.json()

    const authKey =
      typeof body.authKey === 'string'
        ? body.authKey
        : null

    const customerKey =
      typeof body.customerKey ===
      'string'
        ? body.customerKey
        : null

    orderId =
      typeof body.orderId === 'string'
        ? body.orderId
        : null

    const plan = body.plan

    if (
      !authKey ||
      !customerKey ||
      !orderId ||
      !isVIPPlan(plan)
    ) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 },
      )
    }

    const payment =
      await getPaymentByOrderId(
        orderId,
      )

    const config = getVIPPlan(plan)

    /**
     * months → days 변환
     */
    const days = config.months * 30

    if (
      !payment ||
      payment.userId !== user.id
    ) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 },
      )
    }

    /**
     * 중복 결제 방지
     */
    if (payment.status === 'PAID') {
      return NextResponse.json({
        ok: true,
        duplicated: true,
      })
    }

    /**
     * 금액 검증
     */
    if (
      payment.amount !== config.amount
    ) {
      await markPaymentFailed({
        orderId,
        reason: 'AMOUNT_MISMATCH',
      })

      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 },
      )
    }

    /**
     * billing key 발급
     */
    const billing =
      await issueBillingKey({
        authKey,
        customerKey,
        idempotencyKey: `issue_${orderId}`,
      })

    /**
     * billing key 저장
     */
    await saveBillingKey({
      userId: user.id,
      customerKey,
      billingKey: billing.billingKey,
      plan,
    })

    /**
     * 즉시 결제
     */
    const charge =
      await chargeBillingKey({
        billingKey: billing.billingKey,
        customerKey,
        amount: config.amount,
        orderId,
        orderName: config.orderName,
        idempotencyKey: `charge_${orderId}`,
      })

    /**
     * payment paid 처리
     */
    const applied =
      await markPaymentPaid({
        orderId,
        paymentKey: charge.paymentKey,
      })

    /**
     * VIP 적용
     */
    if (applied) {
      await applyVIPPaymentSuccessByDays({
        userId: user.id,
        priceId: plan,
        days,
      })

      await markBillingPaymentSuccess({
        userId: user.id,
        paymentKey: charge.paymentKey,
        orderId,
      })
    }

    logger.info(
      '[TOSS VIP CONFIRM SUCCESS]',
      {
        userId: user.id,
        orderId,
        plan,
        days,
        paymentKey:
          charge.paymentKey,
      },
    )

    return NextResponse.json({
      ok: true,
      paymentKey:
        charge.paymentKey,
      days,
    })
  } catch (error) {
    logger.error(
      '[TOSS VIP CONFIRM FAILED]',
      {
        orderId,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown confirm error',
      },
    )

    if (orderId) {
      await markPaymentFailed({
        orderId,
        reason:
          error instanceof Error
            ? error.message
            : 'Unknown confirm error',
      })
    }

    return NextResponse.json(
      { error: 'Toss confirm failed' },
      { status: 500 },
    )
  }
}
