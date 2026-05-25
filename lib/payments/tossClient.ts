//lib/payments/tossClient.ts  

export type TossConfirmPaymentParams = {
  paymentKey: string
  orderId: string
  amount: number
}

export type TossPaymentResponse = {
  mId?: string
  version?: string
  paymentKey: string
  orderId: string
  orderName?: string
  currency?: string
  method?: string
  status: string
  totalAmount: number
  balanceAmount?: number
  suppliedAmount?: number
  vat?: number
  requestedAt?: string
  approvedAt?: string
  useEscrow?: boolean
  cultureExpense?: boolean
  card?: unknown
  virtualAccount?: unknown
  transfer?: unknown
  mobilePhone?: unknown
  giftCertificate?: unknown
  cashReceipt?: unknown
  receipt?: unknown
  checkout?: unknown
  easyPay?: unknown
  country?: string
  failure?: unknown
  cashReceipts?: unknown[]
  discount?: unknown
  cancels?: unknown[]
}

export class TossPaymentError extends Error {
  code?: string
  status?: number
  response?: unknown

  constructor({
    message,
    code,
    status,
    response,
  }: {
    message: string
    code?: string
    status?: number
    response?: unknown
  }) {
    super(message)
    this.name = 'TossPaymentError'
    this.code = code
    this.status = status
    this.response = response
  }
}

function getTossSecretKey() {
  const secretKey = process.env.TOSS_SECRET_KEY

  if (!secretKey) {
    throw new Error('TOSS_SECRET_KEY 환경변수가 필요합니다.')
  }

  return secretKey
}

function createTossBasicAuthHeader() {
  const secretKey = getTossSecretKey()
  const encoded = Buffer.from(`${secretKey}:`).toString('base64')

  return `Basic ${encoded}`
}

export async function confirmTossPayment({
  paymentKey,
  orderId,
  amount,
}: TossConfirmPaymentParams): Promise<TossPaymentResponse> {
  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: createTossBasicAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
    cache: 'no-store',
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new TossPaymentError({
      message: data?.message || 'Toss 결제 승인 실패',
      code: data?.code,
      status: res.status,
      response: data,
    })
  }

  return data as TossPaymentResponse
}
