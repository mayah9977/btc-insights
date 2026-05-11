import { NextRequest, NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payments/provider'
import { handleTossWebhook } from '@/lib/payments/toss'
import { handleStripeWebhook } from '@/lib/payments/stripe'

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
