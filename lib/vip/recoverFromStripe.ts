// lib/vip/recoverFromStripe.ts
import Stripe from 'stripe'
import { recoverVIPUntil } from '@/lib/vip/vipDB'
import { logger } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
})

function escapeStripeSearchValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) return null
  if (typeof customer === 'string') return customer
  return customer.id
}

function isActiveSubscription(subscription: Stripe.Subscription): boolean {
  return subscription.status === 'active' || subscription.status === 'trialing'
}

function getSubscriptionPriceId(
  subscription: Stripe.Subscription,
): string | null {
  return subscription.items.data[0]?.price?.id ?? null
}

function getCurrentPeriodEndMs(subscription: Stripe.Subscription): number | null {
  const raw = (subscription as unknown as {
    current_period_end?: unknown
  }).current_period_end

  if (typeof raw !== 'number') return null

  const ms = raw * 1000
  return Number.isFinite(ms) && ms > Date.now() ? ms : null
}

export async function recoverVIPFromStripe(userId: string): Promise<boolean> {
  try {
    const safeUserId = escapeStripeSearchValue(userId)

    const customers = await stripe.customers.search({
      query: `metadata['userId']:'${safeUserId}'`,
      limit: 10,
    })

    const customerIds = new Set(customers.data.map(customer => customer.id))

    const subscriptions = await stripe.subscriptions.search({
      query: `metadata['userId']:'${safeUserId}' AND (status:'active' OR status:'trialing')`,
      limit: 100,
    })

    const validSubscriptions = subscriptions.data
      .filter(subscription => {
        if (!isActiveSubscription(subscription)) return false
        if (subscription.metadata?.userId !== userId) return false

        const customerId = getCustomerId(subscription.customer)

        if (customerIds.size > 0 && customerId) {
          return customerIds.has(customerId)
        }

        return true
      })
      .sort((a, b) => {
        const aEnd = getCurrentPeriodEndMs(a) ?? 0
        const bEnd = getCurrentPeriodEndMs(b) ?? 0
        return bEnd - aEnd
      })

    const subscription = validSubscriptions[0]
    if (!subscription) return false

    const priceId = getSubscriptionPriceId(subscription)
    if (!priceId) return false

    const expiredAt = getCurrentPeriodEndMs(subscription)
    if (!expiredAt) return false

    await recoverVIPUntil(userId, 'VIP', expiredAt, priceId)

    logger.info('[VIP Recover From Stripe Success]', {
      userId,
      priceId,
      subscriptionId: subscription.id,
      status: subscription.status,
      expiredAt,
    })

    return true
  } catch (error) {
    logger.error('[VIP Recover From Stripe Failed]', {
      userId,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown recoverVIPFromStripe error',
    })

    return false
  }
}
