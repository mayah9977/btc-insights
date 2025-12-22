import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import {
  saveUserVIP,
  downgradeUserVIP,
  enableAutoExtend,
} from '@/lib/vip/vipDB';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid Stripe signature' },
      { status: 400 }
    );
  }

  switch (event.type) {
    /**
     * ✅ 결제 완료
     * - VIP 상품 결제
     * - 자동 연장 Add-on 상품 선택 시 옵션 활성화
     */
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.client_reference_id;
      const priceId = session.metadata?.priceId;

      if (userId && priceId) {
        /**
         * 1️⃣ VIP 기본 부여
         */
        await saveUserVIP(userId, priceId);

        /**
         * 2️⃣ VIP 자동 연장 Add-on (유료)
         * - Stripe Checkout metadata 기반
         * - Add-on Price 선택 시 metadata에 autoExtendDays 전달
         *
         * 예:
         * autoExtendDays = "7"  → 만료 시 +7일 자동 연장
         */
        const autoDays = Number(session.metadata?.autoExtendDays || 0);
        if (autoDays > 0) {
          await enableAutoExtend(userId, autoDays);
        }
      }
      break;
    }

    /**
     * ✅ 구독 취소
     * - VIP 즉시 제거 ❌
     * - expiredAt = now → Grace Period 처리
     */
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;

      if (userId) {
        await downgradeUserVIP(userId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
