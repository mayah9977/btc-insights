//app/api/stripe/portal/route.ts   

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    return null
  }

  return new Stripe(secretKey)
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripeClient()

    if (!stripe) {
      return NextResponse.json(
        {
          error: 'Stripe is disabled',
          message: 'STRIPE_SECRET_KEY is not configured',
        },
        { status: 503 }
      )
    }

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
