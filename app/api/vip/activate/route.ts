//app/api/vip/activate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createHash, createDecipheriv } from 'crypto'
import { redis } from '@/lib/redis/index'
import { adminAuth } from '@/lib/firebase/admin'
import { isVIPSignupOrderId } from '@/lib/payments/orderId'
import { setUserVIPLevel } from '@/lib/vip/vipServer'
import {
  getVIPPlan,
  isVIPPlan,
  type VIPPlan,
} from '@/lib/payments/vipPlans'
import {
  applyVIPSignupEntitlement,
  VIPSignupEntitlementError,
} from '@/lib/toss/paymentDB'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PublicActivationErrorCode =
  | 'VIP_ACTIVATION_INVALID_REQUEST'
  | 'VIP_ACTIVATION_INVALID_STATE'
  | 'TOSS_APPROVAL_EVIDENCE_MISSING'
  | 'VIP_ACTIVATION_DATA_MISMATCH'
  | 'VIP_ACTIVATION_FAILED'

type ActivateVIPBody = {
  orderId?: string
  paymentKey?: string
}

type UnknownRecord = Record<string, unknown>

class VIPActivationRouteError extends Error {
  readonly code: PublicActivationErrorCode
  readonly status: number
  readonly publicMessage: string

  constructor({
    code,
    status,
    publicMessage,
  }: {
    code: PublicActivationErrorCode
    status: number
    publicMessage: string
  }) {
    super(code)
    this.name = 'VIPActivationRouteError'
    this.code = code
    this.status = status
    this.publicMessage = publicMessage
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getRequiredString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized || null
}

function getPositiveInteger(value: unknown): number | null {
  const parsed = Number(value)

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function hasValidTossApprovalEvidence({
  order,
  orderId,
  paymentKey,
  amount,
}: {
  order: UnknownRecord
  orderId: string
  paymentKey: string
  amount: number
}): boolean {
  const payment = order.payment

  const browserConfirmValid =
    isRecord(payment) &&
    payment.status === 'DONE' &&
    payment.orderId === orderId &&
    payment.paymentKey === paymentKey &&
    getPositiveInteger(payment.totalAmount) === amount

  const webhookConfirmValid =
    order.confirmedByWebhook === true &&
    order.webhookStatus === 'DONE' &&
    order.webhookPaymentKey === paymentKey &&
    getPositiveInteger(order.webhookTotalAmount) === amount

  return browserConfirmValid || webhookConfirmValid
}

function throwInvalidRequest(): never {
  throw new VIPActivationRouteError({
    code: 'VIP_ACTIVATION_INVALID_REQUEST',
    status: 400,
    publicMessage: 'VIP 활성화 요청 정보가 올바르지 않습니다.',
  })
}

function throwInvalidState(): never {
  throw new VIPActivationRouteError({
    code: 'VIP_ACTIVATION_INVALID_STATE',
    status: 409,
    publicMessage: 'VIP 활성화 상태를 확인할 수 없습니다.',
  })
}

function getPublicHelperError(
  error: VIPSignupEntitlementError,
): VIPActivationRouteError {
  if (
    error.code === 'INVALID_SIGNUP_ORDER_ID' ||
    error.code === 'INVALID_PAYMENT_KEY' ||
    error.code === 'INVALID_FIREBASE_UID' ||
    error.code === 'INVALID_VIP_PLAN' ||
    error.code === 'VIP_PLAN_AMOUNT_MISMATCH'
  ) {
    return new VIPActivationRouteError({
      code: 'VIP_ACTIVATION_INVALID_REQUEST',
      status: 400,
      publicMessage: 'VIP 활성화 요청 정보가 올바르지 않습니다.',
    })
  }

  if (
    error.code === 'PAYMENT_ROW_MISMATCH' ||
    error.code === 'PAYMENT_PAID_AT_MISSING' ||
    error.code === 'ENTITLEMENT_STATE_MISMATCH'
  ) {
    return new VIPActivationRouteError({
      code: 'VIP_ACTIVATION_DATA_MISMATCH',
      status: 409,
      publicMessage: 'VIP 활성화 데이터 상태가 일치하지 않습니다.',
    })
  }

  return new VIPActivationRouteError({
    code: 'VIP_ACTIVATION_FAILED',
    status: 500,
    publicMessage: 'VIP 활성화 처리 중 오류가 발생했습니다.',
  })
}

function getEncryptionKey() {
  const secret = process.env.VIP_SIGNUP_SECRET

  if (!secret || secret.length < 32) {
    throw new Error('VIP_SIGNUP_SECRET 환경변수는 최소 32자 이상이어야 합니다.')
  }

  return createHash('sha256').update(secret).digest()
}

function decryptPassword(encryptedPassword: string) {
  const [ivHex, authTagHex, encryptedHex] = encryptedPassword.split(':')

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('저장된 비밀번호 암호화 형식이 올바르지 않습니다.')
  }

  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

async function createOrGetFirebaseUser(email: string, password: string) {
  try {
    return await adminAuth.createUser({
      email,
      password,
      emailVerified: false,
      disabled: false,
    })
  } catch (e: any) {
    if (e?.code === 'auth/email-already-exists') {
      return adminAuth.getUserByEmail(email)
    }

    throw e
  }
}

async function persistActivatedState({
  redisKey,
  order,
  firebaseUid,
  firebaseEmail,
  orderId,
  paymentKey,
}: {
  redisKey: string
  order: UnknownRecord
  firebaseUid: string
  firebaseEmail: string | null
  orderId: string
  paymentKey: string
}) {
  const activatedAt =
    getRequiredString(order.activatedAt) || new Date().toISOString()

  const resolvedEmail =
    firebaseEmail ||
    getRequiredString(order.firebaseEmail) ||
    getRequiredString(order.email)

  const activatedOrder = {
    ...order,
    status: 'ACTIVATED',
    firebaseUid,
    firebaseEmail: resolvedEmail,
    encryptedPassword: null,
    activatedAt,
  }

  await redis.set(
    redisKey,
    JSON.stringify(activatedOrder),
    'EX',
    60 * 60 * 24 * 365,
  )

  await redis.set(
    `vip:activation:${firebaseUid}`,
    JSON.stringify({
      uid: firebaseUid,
      email: resolvedEmail,
      level: 'VIP',
      source: 'VIP_SIGNUP_TOSS',
      orderId,
      paymentKey,
      activatedAt,
    }),
    'EX',
    60 * 60 * 24 * 365,
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ActivateVIPBody
    const orderId = body.orderId
    const paymentKey = body.paymentKey

    if (!orderId || !paymentKey) {
      throwInvalidRequest()
    }

    if (!isVIPSignupOrderId(orderId)) {
      throwInvalidRequest()
    }

    const redisKey = `payment:toss:signup:${orderId}`
    const raw = await redis.get(redisKey)

    if (!raw) {
      throwInvalidState()
    }

    const parsedOrder: unknown = JSON.parse(raw)

    if (!isRecord(parsedOrder)) {
      throwInvalidState()
    }

    const order = parsedOrder

    if (order.flowType !== 'VIP_SIGNUP') {
      throwInvalidState()
    }

    const storedOrderId = getRequiredString(order.orderId)
    if (storedOrderId !== null && storedOrderId !== orderId) {
      throwInvalidState()
    }

    if (order.status !== 'DONE' && order.status !== 'ACTIVATED') {
      throwInvalidState()
    }

    if (getRequiredString(order.paymentKey) !== paymentKey) {
      throwInvalidState()
    }

    const planValue = order.plan

    if (!isVIPPlan(planValue)) {
      throwInvalidState()
    }

    const plan: VIPPlan = planValue
    const amount = getPositiveInteger(order.amount)

    if (amount === null || amount !== getVIPPlan(plan).amount) {
      throwInvalidState()
    }

    if (
      !hasValidTossApprovalEvidence({
        order,
        orderId,
        paymentKey,
        amount,
      })
    ) {
      throw new VIPActivationRouteError({
        code: 'TOSS_APPROVAL_EVIDENCE_MISSING',
        status: 409,
        publicMessage: '결제 승인 정보를 확인할 수 없습니다.',
      })
    }

    if (order.status === 'ACTIVATED') {
      const firebaseUid = getRequiredString(order.firebaseUid)

      if (!firebaseUid) {
        throwInvalidState()
      }

      await applyVIPSignupEntitlement({
        orderId,
        paymentKey,
        firebaseUid,
        plan,
        amount,
      })

      await setUserVIPLevel(firebaseUid, 'VIP')

      const firebaseEmail =
        getRequiredString(order.firebaseEmail) ||
        getRequiredString(order.email)

      await persistActivatedState({
        redisKey,
        order,
        firebaseUid,
        firebaseEmail,
        orderId,
        paymentKey,
      })

      const customToken = await adminAuth.createCustomToken(firebaseUid)

      return NextResponse.json({
        ok: true,
        alreadyActivated: true,
        uid: firebaseUid,
        email: firebaseEmail,
        vipLevel: 'VIP',
        customToken,
      })
    }

    const email = getRequiredString(order.email)
    const encryptedPassword = getRequiredString(order.encryptedPassword)

    if (!email || !encryptedPassword) {
      throwInvalidState()
    }

    const password = decryptPassword(encryptedPassword)
    const firebaseUser = await createOrGetFirebaseUser(email, password)

    await applyVIPSignupEntitlement({
      orderId,
      paymentKey,
      firebaseUid: firebaseUser.uid,
      plan,
      amount,
    })

    await setUserVIPLevel(firebaseUser.uid, 'VIP')

    const firebaseEmail = firebaseUser.email || email

    await persistActivatedState({
      redisKey,
      order,
      firebaseUid: firebaseUser.uid,
      firebaseEmail,
      orderId,
      paymentKey,
    })

    const customToken = await adminAuth.createCustomToken(firebaseUser.uid)

    return NextResponse.json({
      ok: true,
      alreadyActivated: false,
      uid: firebaseUser.uid,
      email: firebaseEmail,
      vipLevel: 'VIP',
      customToken,
    })
  } catch (error: unknown) {
    if (error instanceof VIPActivationRouteError) {
      return NextResponse.json(
        {
          ok: false,
          code: error.code,
          message: error.publicMessage,
        },
        { status: error.status },
      )
    }

    if (error instanceof VIPSignupEntitlementError) {
      const publicError = getPublicHelperError(error)

      return NextResponse.json(
        {
          ok: false,
          code: publicError.code,
          message: publicError.publicMessage,
        },
        { status: publicError.status },
      )
    }

    return NextResponse.json(
      {
        ok: false,
        code: 'VIP_ACTIVATION_FAILED',
        message: 'VIP 활성화 처리 중 오류가 발생했습니다.',
      },
      { status: 500 },
    )
  }
}
