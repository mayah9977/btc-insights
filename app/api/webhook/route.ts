import { NextRequest, NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payment/provider'
import { handleTossWebhook } from '@/lib/payment/toss'
import { handleStripeWebhook } from '@/lib/payment/stripe'

export async function POST(req: NextRequest) {
  const provider = getPaymentProvider()

  if (provider === 'toss') {
    const body = await req.json()
    await handleTossWebhook(body)
  }

  if (provider === 'stripe') {
    await handleStripeWebhook(req)
  }

  return NextResponse.json({ ok: true, provider })
}
