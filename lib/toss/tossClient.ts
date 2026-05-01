import { logger } from '@/lib/logger'

const TOSS_BASE_URL = 'https://api.tosspayments.com'

function getTossAuthHeader(): string {
  const secretKey = process.env.TOSS_SECRET_KEY

  if (!secretKey) {
    throw new Error('TOSS_SECRET_KEY is not defined')
  }

  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`
}

async function parseTossResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | null

  if (!res.ok) {
    logger.error('[TOSS API ERROR]', {
      status: res.status,
      data,
    })

    throw new Error('Toss API request failed')
  }

  if (!data) {
    throw new Error('Empty Toss API response')
  }

  return data
}

export type TossBillingKeyIssueResponse = {
  billingKey: string
  customerKey: string
  card?: {
    company?: string
    number?: string
  }
}

export type TossPaymentResponse = {
  paymentKey: string
  orderId: string
  orderName: string
  status: string
  totalAmount: number
  approvedAt?: string
}

export async function issueBillingKey({
  authKey,
  customerKey,
  idempotencyKey,
}: {
  authKey: string
  customerKey: string
  idempotencyKey: string
}): Promise<TossBillingKeyIssueResponse> {
  const res = await fetch(
    `${TOSS_BASE_URL}/v1/billing/authorizations/issue`,
    {
      method: 'POST',
      headers: {
        Authorization: getTossAuthHeader(),
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        authKey,
        customerKey,
      }),
    },
  )

  return parseTossResponse<TossBillingKeyIssueResponse>(res)
}

export async function chargeBillingKey({
  billingKey,
  customerKey,
  amount,
  orderId,
  orderName,
  idempotencyKey,
}: {
  billingKey: string
  customerKey: string
  amount: number
  orderId: string
  orderName: string
  idempotencyKey: string
}): Promise<TossPaymentResponse> {
  const res = await fetch(`${TOSS_BASE_URL}/v1/billing/${billingKey}`, {
    method: 'POST',
    headers: {
      Authorization: getTossAuthHeader(),
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      customerKey,
      amount,
      orderId,
      orderName,
    }),
  })

  return parseTossResponse<TossPaymentResponse>(res)
}

export async function confirmPayment({
  paymentKey,
  orderId,
  amount,
  idempotencyKey,
}: {
  paymentKey: string
  orderId: string
  amount: number
  idempotencyKey: string
}): Promise<TossPaymentResponse> {
  const res = await fetch(`${TOSS_BASE_URL}/v1/payments/confirm`, {
    method: 'POST',
    headers: {
      Authorization: getTossAuthHeader(),
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  })

  return parseTossResponse<TossPaymentResponse>(res)
}
