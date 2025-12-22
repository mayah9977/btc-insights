// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { vipLevel, userId, locale } = await req.json();

    if (!vipLevel || !userId) {
      return NextResponse.json({ error: 'Missing vipLevel or userId' }, { status: 400 });
    }

    let priceId: string | undefined;

    if (vipLevel === 'VIP1') priceId = process.env.STRIPE_PRICE_VIP1;
    if (vipLevel === 'VIP2') priceId = process.env.STRIPE_PRICE_VIP2;
    if (vipLevel === 'VIP3') priceId = process.env.STRIPE_PRICE_VIP3;

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid VIP level' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId, // 🔑 Webhook에서 VIP 저장에 사용
      metadata: {
        priceId, // 🔑 webhook에서 VIP level 매핑
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/casino/vip?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/casino?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Stripe checkout failed' }, { status: 500 });
  }
}
