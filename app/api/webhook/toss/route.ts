import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis/index'
import { getPaymentFlowFromOrderId } from '@/lib/payments/orderId'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type TossWebhookEvent = {
  eventType?: string
  createdAt?: string
  data?: {
    paymentKey?: string
    orderId?: string
    status?: string
    totalAmount?: number
    [key: string]: unknown
  }
  paymentKey?: string
  orderId?: string
  status?: string
  payment?: {
    paymentKey?: string
    orderId?: string
    status?: string
    totalAmount?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

function extractWebhookPaymentInfo(event: TossWebhookEvent) {
  const orderId =
    event.data?.orderId ||
    event.orderId ||
    event.payment?.orderId ||
    null

  const paymentKey =
    event.data?.paymentKey ||
    event.paymentKey ||
    event.payment?.paymentKey ||
    null

  const status =
    event.data?.status ||
    event.status ||
    event.payment?.status ||
    null

  const totalAmount =
    event.data?.totalAmount ||
    event.payment?.totalAmount ||
    null

  return {
    orderId,
    paymentKey,
    status,
    totalAmount,
  }
}

function getAppUrl(req: NextRequest) {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_URL

  if (envUrl) {
    if (envUrl.startsWith('http')) {
      return envUrl.replace(/\/$/, '')
    }

    return `https://${envUrl.replace(/\/$/, '')}`
  }

  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('host')

  if (!host) {
    throw new Error('host header를 찾을 수 없습니다.')
  }

  return `${proto}://${host}`
}

async function saveWebhookAuditLog(orderId: string, event: TossWebhookEvent) {
  await redis.set(
    `payment:toss:webhook:${orderId}:${Date.now()}`,
    JSON.stringify(event),
    'EX',
    60 * 60 * 24 * 30
  )
}

async function callVIPActivateFallback({
  req,
  orderId,
  paymentKey,
}: {
  req: NextRequest
  orderId: string
  paymentKey: string
}) {
  const appUrl = getAppUrl(req)

  try {
    const activateRes = await fetch(`${appUrl}/api/vip/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vip-activation-source': 'toss-webhook',
      },
      body: JSON.stringify({
        orderId,
        paymentKey,
      }),
      cache: 'no-store',
    })

    const activateData = await activateRes.json().catch(() => null)

    await redis.set(
      `payment:toss:signup:activate_fallback:${orderId}`,
      JSON.stringify({
        ok: activateRes.ok,
        status: activateRes.status,
        response: activateData,
        calledAt: new Date().toISOString(),
      }),
      'EX',
      60 * 60 * 24 * 30
    )

    return {
      ok: activateRes.ok,
      status: activateRes.status,
      response: activateData,
    }
  } catch (e: any) {
    await redis.set(
      `payment:toss:signup:activate_fallback_error:${orderId}`,
      JSON.stringify({
        message: e?.message || 'VIP activate fallback 실패',
        calledAt: new Date().toISOString(),
      }),
      'EX',
      60 * 60 * 24 * 30
    )

    return {
      ok: false,
      status: 500,
      response: {
        message: e?.message || 'VIP activate fallback 실패',
      },
    }
  }
}

async function handleVIPSignupWebhook({
  req,
  orderId,
  paymentKey,
  status,
  totalAmount,
  event,
}: {
  req: NextRequest
  orderId: string
  paymentKey: string | null
  status: string | null
  totalAmount: number | null
  event: TossWebhookEvent
}) {
  const redisKey = `payment:toss:signup:${orderId}`
  const raw = await redis.get(redisKey)

  if (!raw) {
    await redis.set(
      `payment:toss:signup:webhook_orphan:${orderId}`,
      JSON.stringify({
        orderId,
        paymentKey,
        status,
        totalAmount,
        webhook: event,
        receivedAt: new Date().toISOString(),
      }),
      'EX',
      60 * 60 * 24 * 30
    )

    return
  }

  const order = JSON.parse(raw)

  const now = new Date().toISOString()

  const nextOrder = {
    ...order,
    webhook: event,
    webhookPaymentKey: paymentKey,
    webhookStatus: status,
    webhookTotalAmount: totalAmount,
    webhookReceivedAt: now,
  }

  const shouldMarkDone =
    status === 'DONE' &&
    paymentKey &&
    order.status !== 'DONE' &&
    order.status !== 'ACTIVATED'

  if (shouldMarkDone) {
    nextOrder.status = 'DONE'
    nextOrder.paymentKey = paymentKey
    nextOrder.confirmedByWebhook = true
    nextOrder.confirmedAt = now
  }

  await redis.set(
    redisKey,
    JSON.stringify(nextOrder),
    'EX',
    60 * 60 * 24 * 30
  )

  const shouldActivate =
    status === 'DONE' &&
    paymentKey &&
    nextOrder.status === 'DONE' &&
    !nextOrder.firebaseUid &&
    !nextOrder.activatedAt

  if (shouldActivate) {
    await callVIPActivateFallback({
      req,
      orderId,
      paymentKey,
    })
  }
}

async function handleVIPBillingLegacyWebhook({
  orderId,
  paymentKey,
  status,
  totalAmount,
  event,
}: {
  orderId: string
  paymentKey: string | null
  status: string | null
  totalAmount: number | null
  event: TossWebhookEvent
}) {
  const redisKey = `payment:toss:billing:${orderId}`
  const raw = await redis.get(redisKey)

  if (!raw) {
    await redis.set(
      `payment:toss:billing:webhook_orphan:${orderId}`,
      JSON.stringify({
        orderId,
        paymentKey,
        status,
        totalAmount,
        webhook: event,
        receivedAt: new Date().toISOString(),
      }),
      'EX',
      60 * 60 * 24 * 30
    )

    return
  }

  const order = JSON.parse(raw)

  await redis.set(
    redisKey,
    JSON.stringify({
      ...order,
      webhook: event,
      webhookPaymentKey: paymentKey,
      webhookStatus: status,
      webhookTotalAmount: totalAmount,
      webhookReceivedAt: new Date().toISOString(),
    }),
    'EX',
    60 * 60 * 24 * 30
  )
}

export async function POST(req: NextRequest) {
  try {
    const event = (await req.json()) as TossWebhookEvent
    const { orderId, paymentKey, status, totalAmount } =
      extractWebhookPaymentInfo(event)

    if (!orderId) {
      return NextResponse.json({ ok: true })
    }

    await saveWebhookAuditLog(orderId, event)

    const flowType = getPaymentFlowFromOrderId(orderId)

    if (flowType === 'VIP_SIGNUP') {
      await handleVIPSignupWebhook({
        req,
        orderId,
        paymentKey,
        status,
        totalAmount,
        event,
      })
    }

    if (flowType === 'VIP_BILLING_LEGACY') {
      await handleVIPBillingLegacyWebhook({
        orderId,
        paymentKey,
        status,
        totalAmount,
        event,
      })
    }

    if (flowType === 'UNKNOWN') {
      await redis.set(
        `payment:toss:webhook:unknown:${orderId}:${Date.now()}`,
        JSON.stringify(event),
        'EX',
        60 * 60 * 24 * 30
      )
    }

    return NextResponse.json({
      ok: true,
      flowType,
    })
  } catch (e: any) {
    console.error('[TOSS_WEBHOOK_ERROR]', e)

    return NextResponse.json({ ok: true })
  }
}
