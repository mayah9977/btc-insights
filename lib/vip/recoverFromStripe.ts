import { logger } from '@/lib/logger'
import { isStripeEnabled } from '@/lib/payment/provider'

export async function recoverVIPFromStripe(userId: string): Promise<boolean> {
  if (!isStripeEnabled()) {
    logger.info('[VIP Recover From Stripe Skipped]', {
      userId,
      reason: 'Stripe provider is disabled',
    })

    return false
  }

  logger.info('[VIP Recover From Stripe Disabled]', {
    userId,
    reason:
      'Stripe recovery is preserved for future global expansion but disabled in current Toss provider mode.',
  })

  return false
}
