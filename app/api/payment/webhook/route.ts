import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // 🔥 Stripe는 Edge 런타임 불가

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing Stripe signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[STRIPE WEBHOOK ERROR]", err);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  // ✅ 결제 완료 이벤트 수신 확인용
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("[STRIPE] Checkout completed", {
      email: session.customer_email,
      id: session.id,
    });

    /**
     * 🔒 DB 연동은 2단계에서 추가
     * - Prisma
     * - Firebase
     * - Supabase
     */
  }

  return NextResponse.json({ received: true });
}
