import { NextRequest, NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payment/provider'
import { handleStripeWebhook } from '@/lib/payment/stripe'

export async function POST(req: NextRequest) {
  const provider = getPaymentProvider()

  if (provider !== 'stripe') {
    return NextResponse.json({
      ok: true,
      provider,
      message: 'Stripe webhook is disabled. Current provider is Toss.',
    })
  }

  await handleStripeWebhook(req)

  return NextResponse.json({
    ok: true,
    provider,
  })
}
