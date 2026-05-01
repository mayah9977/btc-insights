// lib/vip/vipPayment.ts
import Stripe from 'stripe'
import { applyVIPPaymentSuccess } from './vipDB'
import { logger } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
})

function getSubscriptionId(
  subscription: string | Stripe.Subscription | null,
): string | null {
  if (!subscription) return null
  if (typeof subscription === 'string') return subscription
  return subscription.id
}

function getCurrentPeriodEndMs(subscription: Stripe.Subscription): number | null {
  const raw = (subscription as unknown as {
    current_period_end?: unknown
  }).current_period_end

  if (typeof raw !== 'number') return null

  const ms = raw * 1000
  return Number.isFinite(ms) && ms > Date.now() ? ms : null
}

/**
 * 결제 성공 처리 (SSOT Entry)
 * - Stripe Webhook / Checkout Success 이후 호출
 * - subscription 기반으로 expiredAt 계산 (Stripe 기준)
 */
export async function handleVIPPaymentSuccess(
  userId: string,
  subscriptionRef: string | Stripe.Subscription | null,
) {
  try {
    const subscriptionId = getSubscriptionId(subscriptionRef)
    if (!subscriptionId) {
      logger.error('[VIP Payment] Missing subscriptionId', { userId })
      return
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    const priceId = subscription.items.data[0]?.price?.id ?? null
    if (!priceId) {
      logger.error('[VIP Payment] Missing priceId', {
        userId,
        subscriptionId,
      })
      return
    }

    const expiredAt = getCurrentPeriodEndMs(subscription)
    if (!expiredAt) {
      logger.error('[VIP Payment] Invalid current_period_end', {
        userId,
        subscriptionId,
      })
      return
    }

    await applyVIPPaymentSuccess(userId, priceId, expiredAt)

    logger.info('[VIP Payment Success]', {
      userId,
      priceId,
      subscriptionId,
      expiredAt,
    })
  } catch (error) {
    logger.error('[VIP Payment Failed]', {
      userId,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown VIP payment error',
    })
  }
}
