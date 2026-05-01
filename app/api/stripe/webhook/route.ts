// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import {
  recoverVIP,
  downgradeUserVIP,
  enableAutoExtend,
} from '@/lib/vip/vipDB'

import { logger } from '@/lib/logger'
import type { VIPLevel } from '@/lib/vip/vipTypes'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
})

// ✅ VIP 단일 구조 (기간 기반)
function resolveVipProduct(priceId: string): {
  level: VIPLevel
  days: number
} {
  if (priceId === process.env.STRIPE_PRICE_VIP_MONTHLY)
    return { level: 'VIP', days: 30 }

  if (priceId === process.env.STRIPE_PRICE_VIP_6MONTH)
    return { level: 'VIP', days: 180 }

  if (priceId === process.env.STRIPE_PRICE_VIP_12MONTH)
    return { level: 'VIP', days: 365 }

  return { level: 'VIP', days: 30 }
}

function extractSubscriptionId(invoice: Stripe.Invoice): string | null {
  const raw = (invoice as unknown as { subscription?: unknown }).subscription

  if (typeof raw === 'string') return raw

  if (raw && typeof raw === 'object' && 'id' in raw) {
    const id = (raw as { id?: unknown }).id
    return typeof id === 'string' ? id : null
  }

  return null
}

function extractPriceId(invoice: Stripe.Invoice): string | null {
  const line = invoice.lines.data[0]
  if (!line) return null

  if ('pricing' in line && line.pricing) {
    const pricing = line.pricing

    if (
      pricing.type === 'price_details' &&
      pricing.price_details &&
      typeof pricing.price_details.price === 'string'
    ) {
      return pricing.price_details.price
    }
  }

  return null
}

async function grantVIP({
  eventType,
  userId,
  priceId,
  autoExtendDays = 0,
}: {
  eventType: string
  userId: string
  priceId: string
  autoExtendDays?: number
}) {
  const { level, days } = resolveVipProduct(priceId)

  try {
    await recoverVIP(userId, 'VIP', days)

    if (autoExtendDays > 0) {
      await enableAutoExtend(userId, autoExtendDays)
    }

    logger.info('[Stripe VIP Success]', {
      eventType,
      status: 'success',
      userId,
      priceId,
      vipLevel: 'VIP',
      days,
    })
  } catch (error) {
    logger.error('[Stripe VIP Upgrade Failed]', {
      eventType,
      userId,
      priceId,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown VIP upgrade error',
    })

    throw error
  }
}

async function cancelVIP({
  eventType,
  userId,
  priceId,
  reason,
}: {
  eventType: string
  userId: string
  priceId?: string | null
  reason: 'payment_failed' | 'subscription_deleted' | 'subscription_inactive'
}) {
  try {
    await downgradeUserVIP(userId)

    logger.info('[Stripe VIP Cancelled]', {
      eventType,
      status: 'failed',
      reason,
      userId,
      priceId: priceId ?? null,
    })
  } catch (error) {
    logger.error('[Stripe VIP Downgrade Failed]', {
      eventType,
      userId,
      priceId: priceId ?? null,
      reason,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown VIP downgrade error',
    })

    throw error
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    logger.error('[Stripe Webhook Error]', {
      error: 'Missing stripe-signature',
    })

    return NextResponse.json(
      { error: 'Missing stripe-signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    logger.error('[Stripe Webhook Signature Error]', {
      error:
        error instanceof Error
          ? error.message
          : 'Invalid Stripe signature',
    })

    return NextResponse.json(
      { error: 'Invalid Stripe signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const userId =
          session.client_reference_id ?? session.metadata?.userId ?? null

        const priceId = session.metadata?.priceId ?? null

        logger.info('[Stripe Webhook Received]', {
          eventType: event.type,
          status: 'success',
          userId,
          priceId,
          sessionId: session.id,
        })

        if (userId && priceId) {
          await grantVIP({
            eventType: event.type,
            userId,
            priceId,
          })
        }

        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice

        const priceId = extractPriceId(invoice)
        const subscriptionId = extractSubscriptionId(invoice)

        if (!subscriptionId) break

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId)

        const userId = subscription.metadata?.userId ?? null

        logger.info('[Stripe Webhook Received]', {
          eventType: event.type,
          status: 'success',
          userId,
          priceId,
          subscriptionId,
        })

        if (userId && priceId) {
          await grantVIP({
            eventType: event.type,
            userId,
            priceId,
          })
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        const priceId = extractPriceId(invoice)
        const subscriptionId = extractSubscriptionId(invoice)

        if (!subscriptionId) break

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId)

        const userId = subscription.metadata?.userId ?? null

        logger.info('[Stripe Webhook Received]', {
          eventType: event.type,
          status: 'failed',
          userId,
          priceId,
          subscriptionId,
        })

        if (userId) {
          await cancelVIP({
            eventType: event.type,
            userId,
            priceId,
            reason: 'payment_failed',
          })
        }

        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        const userId = sub.metadata?.userId ?? null
        const priceId = sub.items.data[0]?.price?.id ?? null

        logger.info('[Stripe Webhook Received]', {
          eventType: event.type,
          status: 'failed',
          userId,
          priceId,
          subscriptionId: sub.id,
        })

        if (userId) {
          await cancelVIP({
            eventType: event.type,
            userId,
            priceId,
            reason: 'subscription_deleted',
          })
        }

        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription

        const userId = sub.metadata?.userId ?? null
        const priceId = sub.items.data[0]?.price?.id ?? null

        const isActive =
          sub.status === 'active' || sub.status === 'trialing'

        logger.info('[Stripe Webhook Received]', {
          eventType: event.type,
          status: isActive ? 'success' : 'failed',
          userId,
          priceId,
          subscriptionId: sub.id,
        })

        if (!userId) break

        if (isActive && priceId) {
          await grantVIP({
            eventType: event.type,
            userId,
            priceId,
          })
        } else {
          await cancelVIP({
            eventType: event.type,
            userId,
            priceId,
            reason: 'subscription_inactive',
          })
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('[Stripe Webhook Handler Failed]', {
      eventType: event.type,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown webhook handler error',
    })

    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
