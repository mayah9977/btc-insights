// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import {
  recoverVIP,
  downgradeUserVIP,
  enableAutoExtend,
} from '@/lib/vip/vipDB'

import type { VIPLevel } from '@/lib/vip/vipTypes'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
})

/**
 * Stripe priceId → VIP Level + 기간 매핑
 * (실제 상품 ID 기준으로 정확히 맞추세요)
 */
function resolveVipProduct(priceId: string): {
  level: VIPLevel
  days: number
} {
  switch (priceId) {
    case 'price_vip3_30d':
      return { level: 'VIP3', days: 30 }
    case 'price_vip3_90d':
      return { level: 'VIP3', days: 90 }
    case 'price_vip3_180d':
      return { level: 'VIP3', days: 180 }

    default:
      // 안전 기본값
      return { level: 'VIP3', days: 30 }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json(
      { error: 'Invalid Stripe signature' },
      { status: 400 }
    )
  }

  switch (event.type) {
    /**
     * ✅ 결제 완료 → VIP 부여
     */
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      const userId = session.client_reference_id
      const priceId = session.metadata?.priceId

      if (userId && priceId) {
        const { level, days } = resolveVipProduct(priceId)

        /**
         * 1️⃣ VIP 복구 / 신규 부여
         */
        await recoverVIP(userId, level, days)

        /**
         * 2️⃣ 자동 연장 Add-on
         */
        const autoDays = Number(session.metadata?.autoExtendDays || 0)
        if (autoDays > 0) {
          await enableAutoExtend(userId, autoDays)
        }
      }
      break
    }

    /**
     * ✅ 구독 취소 → 만료 처리
     */
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId

      if (userId) {
        await downgradeUserVIP(userId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
