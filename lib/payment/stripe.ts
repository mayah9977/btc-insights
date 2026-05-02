// /lib/payment/stripe.ts

import { grantVIP, cancelVIP } from '@/lib/vip/vipService'
import { logger } from '@/lib/logger'
import { isStripeEnabled } from '@/lib/payment/provider'

type StripeEvent = {
  type: string
  data: {
    object: unknown
  }
}

type StripeCheckoutSession = {
  id: string
  client_reference_id?: string | null
  metadata?: {
    userId?: string
    priceId?: string
  } | null
}

type StripeInvoice = {
  lines?: {
    data?: Array<{
      pricing?: {
        type?: string
        price_details?: {
          price?: string
        } | null
      } | null
    }>
  }
  subscription?: unknown
}

type StripeSubscription = {
  id: string
  status: string
  metadata?: {
    userId?: string
  } | null
  items?: {
    data?: Array<{
      price?: {
        id?: string
      } | null
    }>
  }
}

type StripeClient = {
  webhooks: {
    constructEvent: (
      body: string,
      signature: string,
      secret: string,
    ) => StripeEvent
  }
  subscriptions: {
    retrieve: (id: string) => Promise<StripeSubscription>
  }
}

async function createStripeClient(): Promise<StripeClient | null> {
  if (!isStripeEnabled()) return null

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return null

  const stripeModule = await import('stripe')
  const Stripe = stripeModule.default

  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover',
  }) as unknown as StripeClient
}

function resolveStripeDays(priceId?: string | null) {
  if (!priceId) return 30

  if (priceId === process.env.STRIPE_PRICE_VIP_MONTHLY) return 30
  if (priceId === process.env.STRIPE_PRICE_VIP_6MONTH) return 180
  if (priceId === process.env.STRIPE_PRICE_VIP_12MONTH) return 365

  return 30
}

function extractSubscriptionId(invoice: StripeInvoice): string | null {
  const raw = invoice.subscription

  if (typeof raw === 'string') return raw

  if (raw && typeof raw === 'object' && 'id' in raw) {
    const id = (raw as { id?: unknown }).id
    return typeof id === 'string' ? id : null
  }

  return null
}

function extractPriceId(invoice: StripeInvoice): string | null {
  const line = invoice.lines?.data?.[0]
  if (!line) return null

  const pricing = line.pricing
  if (!pricing) return null

  if (
    pricing.type === 'price_details' &&
    pricing.price_details &&
    typeof pricing.price_details.price === 'string'
  ) {
    return pricing.price_details.price
  }

  return null
}

function getSubscriptionPriceId(
  subscription: StripeSubscription,
): string | null {
  return subscription.items?.data?.[0]?.price?.id ?? null
}

async function grantStripeVIP({
  eventType,
  userId,
  priceId,
}: {
  eventType: string
  userId: string
  priceId: string
}) {
  const days = resolveStripeDays(priceId)
  const expiredAt = Date.now() + days * 86400000

  await grantVIP({
    userId,
    expiredAt,
    ref: priceId,
    source: 'stripe',
  })

  logger.info('[Stripe VIP Granted]', {
    eventType,
    userId,
    priceId,
    days,
    expiredAt,
  })
}

async function cancelStripeVIP({
  eventType,
  userId,
  priceId,
  reason,
}: {
  eventType: string
  userId: string
  priceId?: string | null
  reason: string
}) {
  await cancelVIP({
    userId,
    source: 'stripe',
    reason,
  })

  logger.info('[Stripe VIP Cancelled]', {
    eventType,
    userId,
    priceId: priceId ?? null,
    reason,
  })
}

export async function handleStripeWebhook(req: Request) {
  if (!isStripeEnabled()) {
    logger.info('[Stripe Webhook Disabled]', {
      provider: process.env.PAYMENT_PROVIDER ?? 'toss',
    })
    return
  }

  const stripe = await createStripeClient()

  if (!stripe) {
    logger.error('[Stripe Webhook Error]', {
      error: 'Stripe is enabled but STRIPE_SECRET_KEY is not configured',
    })
    return
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    logger.error('[Stripe Webhook Error]', {
      error: 'STRIPE_WEBHOOK_SECRET is not configured',
    })
    return
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    logger.error('[Stripe Webhook Error]', {
      error: 'Missing stripe-signature',
    })
    return
  }

  let event: StripeEvent

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    )
  } catch (error) {
    logger.error('[Stripe Webhook Signature Error]', {
      error:
        error instanceof Error
          ? error.message
          : 'Invalid Stripe signature',
    })
    return
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as StripeCheckoutSession

      const userId =
        session.client_reference_id ?? session.metadata?.userId ?? null

      const priceId = session.metadata?.priceId ?? null

      logger.info('[Stripe Webhook Received]', {
        eventType: event.type,
        userId,
        priceId,
        sessionId: session.id,
      })

      if (userId && priceId) {
        await grantStripeVIP({
          eventType: event.type,
          userId,
          priceId,
        })
      }

      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as StripeInvoice

      const priceId = extractPriceId(invoice)
      const subscriptionId = extractSubscriptionId(invoice)

      if (!subscriptionId) break

      const subscription =
        await stripe.subscriptions.retrieve(subscriptionId)

      const userId = subscription.metadata?.userId ?? null

      logger.info('[Stripe Webhook Received]', {
        eventType: event.type,
        userId,
        priceId,
        subscriptionId,
      })

      if (userId && priceId) {
        await grantStripeVIP({
          eventType: event.type,
          userId,
          priceId,
        })
      }

      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as StripeInvoice

      const priceId = extractPriceId(invoice)
      const subscriptionId = extractSubscriptionId(invoice)

      if (!subscriptionId) break

      const subscription =
        await stripe.subscriptions.retrieve(subscriptionId)

      const userId = subscription.metadata?.userId ?? null

      logger.info('[Stripe Webhook Received]', {
        eventType: event.type,
        userId,
        priceId,
        subscriptionId,
      })

      if (userId) {
        await cancelStripeVIP({
          eventType: event.type,
          userId,
          priceId,
          reason: 'payment_failed',
        })
      }

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as StripeSubscription

      const userId = subscription.metadata?.userId ?? null
      const priceId = getSubscriptionPriceId(subscription)

      logger.info('[Stripe Webhook Received]', {
        eventType: event.type,
        userId,
        priceId,
        subscriptionId: subscription.id,
      })

      if (userId) {
        await cancelStripeVIP({
          eventType: event.type,
          userId,
          priceId,
          reason: 'subscription_deleted',
        })
      }

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as StripeSubscription

      const userId = subscription.metadata?.userId ?? null
      const priceId = getSubscriptionPriceId(subscription)

      const active =
        subscription.status === 'active' ||
        subscription.status === 'trialing'

      logger.info('[Stripe Webhook Received]', {
        eventType: event.type,
        userId,
        priceId,
        subscriptionId: subscription.id,
        status: subscription.status,
      })

      if (!userId) break

      if (active && priceId) {
        await grantStripeVIP({
          eventType: event.type,
          userId,
          priceId,
        })
      } else {
        await cancelStripeVIP({
          eventType: event.type,
          userId,
          priceId,
          reason: 'subscription_inactive',
        })
      }

      break
    }
  }
}
