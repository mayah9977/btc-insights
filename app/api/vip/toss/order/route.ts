// app/api/vip/toss/order/route.ts

import { NextRequest, NextResponse } from 'next/server'
import {
  createHash,
  randomBytes,
  scryptSync,
  createCipheriv,
} from 'crypto'
import { redis } from '@/lib/redis/index'
import {
  createVIPSignupOrderId,
  isVIPSignupOrderId,
} from '@/lib/payments/orderId'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PlanId = 'MONTHLY' | 'HALF' | 'YEAR'

type CreateVIPSignupOrderBody = {
  email?: string
  password?: string
  pw?: string
  plan?: PlanId
  amount?: number
  locale?: string
}

const PLAN_AMOUNTS: Record<PlanId, number> = {
  MONTHLY: 30000,
  HALF: 150000,
  YEAR: 270000,
}

const PLAN_NAMES: Record<PlanId, string> = {
  MONTHLY: '1개월 VIP',
  HALF: '6개월 VIP',
  YEAR: '12개월 VIP',
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isPlanId(plan: unknown): plan is PlanId {
  return (
    plan === 'MONTHLY' ||
    plan === 'HALF' ||
    plan === 'YEAR'
  )
}

function getAppUrl(req: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL

  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }

  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('host')

  if (!host) {
    throw new Error('host header를 찾을 수 없습니다.')
  }

  return `${proto}://${host}`
}

function getEncryptionSecret() {
  const secret = process.env.VIP_SIGNUP_SECRET

  if (secret && secret.length >= 32) {
    return secret
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEV ONLY] VIP_SIGNUP_SECRET is missing or too short. Using development fallback secret.'
    )

    return 'dev-only-vip-signup-secret-fallback-minimum-32-characters'
  }

  throw new Error(
    'VIP_SIGNUP_SECRET 환경변수는 운영 환경에서 최소 32자 이상이어야 합니다.'
  )
}

function getEncryptionKey() {
  return createHash('sha256').update(getEncryptionSecret()).digest()
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')

  return `${salt}:${hash}`
}

function encryptPassword(password: string) {
  try {
    const key = getEncryptionKey()
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', key, iv)

    const encrypted = Buffer.concat([
      cipher.update(password, 'utf8'),
      cipher.final(),
    ])

    const authTag = cipher.getAuthTag()

    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':')
  } catch (e) {
    console.error('[VIP_SIGNUP] encryptPassword failed:', e)

    const fallbackPayload = JSON.stringify({
      error: 'ENCRYPTION_FAILED',
      createdAt: new Date().toISOString(),
    })

    return `error:${Buffer.from(fallbackPayload).toString('hex')}`
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateVIPSignupOrderBody

    console.log('[VIP_SIGNUP_ORDER] request body:', body)

    const email = body.email?.trim().toLowerCase()
    const password = body.password || body.pw
    const locale = body.locale?.trim() || 'ko'
    const plan = body.plan
    const amount = Number(body.amount)

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { message: '올바른 이메일이 필요합니다.' },
        { status: 400 }
      )
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { message: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    if (!isPlanId(plan)) {
      return NextResponse.json(
        { message: '올바른 VIP 플랜이 필요합니다.' },
        { status: 400 }
      )
    }

    const expectedAmount = PLAN_AMOUNTS[plan]

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { message: '올바른 결제 금액이 필요합니다.' },
        { status: 400 }
      )
    }

    if (amount !== expectedAmount) {
      console.error('[VIP_SIGNUP_ORDER] amount mismatch:', {
        plan,
        receivedAmount: amount,
        expectedAmount,
      })

      return NextResponse.json(
        { message: '플랜 결제 금액이 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    const orderId = createVIPSignupOrderId()

    if (!isVIPSignupOrderId(orderId)) {
      return NextResponse.json(
        { message: 'VIP Signup orderId 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    const orderName = `VIP 멤버십 계정 생성 - ${PLAN_NAMES[plan]}`
    const appUrl = getAppUrl(req)

    const passwordHash = hashPassword(password)
    const encryptedPassword = encryptPassword(password)

    const order = {
      flowType: 'VIP_SIGNUP' as const,
      orderId,
      email,
      plan,
      amount,
      orderName,
      status: 'READY' as const,
      passwordHash,
      encryptedPassword,
      createdAt: new Date().toISOString(),
    }

    console.log('[VIP_SIGNUP_ORDER] created order:', {
      orderId,
      email,
      plan,
      amount,
      orderName,
    })

    await redis.set(
      `payment:toss:signup:${orderId}`,
      JSON.stringify(order),
      'EX',
      60 * 60
    )

    return NextResponse.json({
      ok: true,
      flowType: 'VIP_SIGNUP',
      orderId,
      plan,
      amount,
      orderName,
      successUrl: `${appUrl}/${locale}/casino/vip/payment/success`,
      failUrl: `${appUrl}/${locale}/casino/vip/payment/fail`,
    })
  } catch (e: any) {
    console.error('[VIP_SIGNUP_ORDER_ERROR]', e)

    return NextResponse.json(
      { message: e?.message || 'VIP 결제 주문 생성 실패' },
      { status: 500 }
    )
  }
}
