// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
})

type VipPlan = 'monthly' | '6month' | '12month'

function resolvePriceId(plan: VipPlan): string | undefined {
  if (plan === 'monthly') return process.env.STRIPE_PRICE_VIP_MONTHLY
  if (plan === '6month') return process.env.STRIPE_PRICE_VIP_6MONTH
  if (plan === '12month') return process.env.STRIPE_PRICE_VIP_12MONTH
  return undefined
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const userId = typeof body.userId === 'string' ? body.userId : null
    const locale = typeof body.locale === 'string' ? body.locale : 'ko'
    const plan = (typeof body.plan === 'string'
      ? body.plan
      : 'monthly') as VipPlan

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 },
      )
    }

    const priceId = resolvePriceId(plan)

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid VIP plan' },
        { status: 400 },
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],

      client_reference_id: userId,

      metadata: {
        userId,
        priceId,
        plan,
        vipLevel: 'VIP',
      },

      subscription_data: {
        metadata: {
          userId,
          priceId,
          plan,
          vipLevel: 'VIP',
        },
      },

      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/vip/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/casino?canceled=1`,
    })

    logger.info('[Stripe Checkout Created]', {
      userId,
      priceId,
      plan,
      sessionId: session.id,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    logger.error('[Stripe Checkout Error]', {
      error:
        error instanceof Error
          ? error.message
          : 'Unknown checkout error',
    })

    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 },
    )
  }
}
