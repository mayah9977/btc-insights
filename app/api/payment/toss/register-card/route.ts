// app/api/payment/toss/register-card/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { randomUUID } from 'crypto'

import { createPendingPayment } from '@/lib/toss/paymentDB'

import {
  getVIPPlan,
  isVIPPlan,
  type VIPPlan,
} from '@/lib/payments/vipPlans'

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'

function getAppUrl(req: NextRequest) {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL

  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }

  const proto =
    req.headers.get(
      'x-forwarded-proto',
    ) || 'https'

  const host = req.headers.get('host')

  if (!host) {
    throw new Error(
      'host header를 찾을 수 없습니다.',
    )
  }

  return `${proto}://${host}`
}

function createSafeCustomerKey(
  value: string,
) {
  return `customer_${value}`
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 50)
}

export async function POST(
  req: NextRequest,
) {
  try {
    console.log(
      '[TOSS_REGISTER_CARD] guest payment request start',
    )

    const cookieHeader =
      req.headers.get('cookie')

    console.log(
      '[TOSS_REGISTER_CARD] cookie header',
      {
        hasCookie: !!cookieHeader,
        cookie: cookieHeader,
      },
    )

    const body = await req.json()

    const plan = body?.plan

    console.log(
      '[TOSS_REGISTER_CARD] request body',
      {
        plan,
        type: typeof plan,
      },
    )

    /**
     * 🔥 핵심 디버그:
     * 실제 허용 enum 출력
     */
    console.log(
      '[TOSS_REGISTER_CARD] available VIP plans',
      {
        allowed: [
          'MONTHLY',
          'HALF',
          'YEAR',
        ],
      },
    )

    if (!isVIPPlan(plan)) {
      console.log(
        '[TOSS_REGISTER_CARD] invalid plan detected',
        {
          received: plan,
        },
      )

      return NextResponse.json(
        {
          error: 'Invalid plan',
        },
        {
          status: 400,
        },
      )
    }

    const safePlan: VIPPlan = plan

    const config =
      getVIPPlan(safePlan)

    const guestId = randomUUID()
      .replace(/-/g, '')
      .slice(0, 24)

    const orderId = `vip_guest_${Date.now()}_${guestId}`

    const customerKey =
      createSafeCustomerKey(
        `guest_${guestId}`,
      )

    console.log(
      '[TOSS_REGISTER_CARD] create guest pending payment',
      {
        orderId,
        guestId,
        customerKey,
        plan: safePlan,
        amount: config.amount,
      },
    )

    await createPendingPayment({
      orderId,

      userId: `guest_${guestId}`,

      plan: safePlan,

      amount: config.amount,
    })

    const appUrl = getAppUrl(req)

    console.log(
      '[TOSS_REGISTER_CARD] guest register-card success',
      {
        orderId,
        customerKey,
        plan: safePlan,
      },
    )

    return NextResponse.json({
      clientKey:
        process.env
          .NEXT_PUBLIC_TOSS_CLIENT_KEY,

      customerKey,

      orderId,

      orderName: config.orderName,

      amount: config.amount,

      successUrl: `${appUrl}/ko/vip/success`,

      failUrl: `${appUrl}/ko/vip/fail`,
    })
  } catch (error) {
    console.log(
      '[TOSS_REGISTER_CARD] failed',
      error,
    )

    return NextResponse.json(
      {
        error:
          'REGISTER_CARD_FAILED',
      },
      {
        status: 500,
      },
    )
  }
}
