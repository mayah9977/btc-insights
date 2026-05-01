import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { customerId, locale } = await req.json()

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing customerId' },
        { status: 400 }
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/casino/vip`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[Stripe Portal Error]', err)
    return NextResponse.json(
      { error: 'Portal creation failed' },
      { status: 500 }
    )
  }
}
