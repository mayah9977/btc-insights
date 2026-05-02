import { grantVIP, cancelVIP } from '@/lib/vip/vipService'
import { logger } from '@/lib/logger'

type TossWebhookBody = {
  eventType?: string
  data?: {
    status?: string
    totalAmount?: number
    orderId?: string
    paymentKey?: string
    metadata?: {
      userId?: string
      plan?: string
    }
  }
}

function resolveDays(amount?: number, plan?: string) {
  if (plan === 'MONTHLY') return 30
  if (plan === 'HALF') return 180
  if (plan === 'YEAR') return 365

  if (amount === 30000) return 30
  if (amount === 150000) return 180
  if (amount === 270000) return 365

  return 30
}

export async function handleTossWebhook(body: TossWebhookBody) {
  const eventType = body?.eventType
  const data = body?.data

  const status = data?.status
  const userId = data?.metadata?.userId
  const plan = data?.metadata?.plan
  const amount = data?.totalAmount
  const ref =
    data?.paymentKey ??
    data?.orderId ??
    String(amount ?? plan ?? 'toss-payment')

  logger.info('[Toss Webhook Received]', {
    eventType,
    status,
    userId,
    plan,
    amount,
    ref,
  })

  if (!userId) return

  if (status === 'DONE') {
    const days = resolveDays(amount, plan)
    const expiredAt = Date.now() + days * 86400000

    await grantVIP({
      userId,
      expiredAt,
      ref,
      source: 'toss',
    })

    logger.info('[Toss VIP Granted]', {
      userId,
      days,
      expiredAt,
      ref,
    })

    return
  }

  if (status === 'FAILED' || status === 'CANCELED') {
    await cancelVIP({
      userId,
      source: 'toss',
      reason: status,
    })

    logger.info('[Toss VIP Cancelled]', {
      userId,
      status,
      ref,
    })
  }
}
