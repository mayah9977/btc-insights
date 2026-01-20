import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { upgradeUserVip } from '@/lib/vip/vipService'
import type { VIPLevel } from '@/lib/vip/vipTypes'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * Stripe VIP Level → 기간(days) 매핑
 * 실제 상품 구성에 맞게 조정
 */
function resolveVipDays(vipLevel: VIPLevel): number {
  switch (vipLevel) {
    case 'VIP3':
      return 30
    case 'VIP2':
      return 30
    case 'VIP1':
      return 30
    default:
      return 30
  }
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const body = await req.text()

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid Stripe signature' },
      { status: 400 }
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.userId
    const vipLevel = session.metadata?.vipLevel as VIPLevel | undefined

    if (userId && vipLevel) {
      const days = resolveVipDays(vipLevel)

      // ✅ 반드시 3번째 인자 days 전달
      await upgradeUserVip(userId, vipLevel, days)
    }
  }

  return NextResponse.json({ received: true })
}
