import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { upgradeUserVip } from '@/lib/vip/vipService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const body = await req.text();

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const vipLevel = session.metadata?.vipLevel as any;

    if (userId && vipLevel) {
      await upgradeUserVip(userId, vipLevel);
    }
  }

  return NextResponse.json({ received: true });
}
