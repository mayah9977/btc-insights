import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Prisma or DB 연결 파일

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new NextResponse("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_email;

    if (email) {
      await db.user.update({
        where: { email },
        data: {
          isPaid: true,
          paidUntil: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ),
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
