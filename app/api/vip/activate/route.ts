//app/api/vip/activate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createHash, createDecipheriv } from 'crypto'
import { redis } from '@/lib/redis/index'
import { adminAuth } from '@/lib/firebase/admin'
import { isVIPSignupOrderId } from '@/lib/payments/orderId'
import { setUserVIPLevel } from '@/lib/vip/vipServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ActivateVIPBody = {
  orderId?: string
  paymentKey?: string
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ActivateVIPBody
    const orderId = body.orderId
    const paymentKey = body.paymentKey

    if (!orderId || !paymentKey) {
      return NextResponse.json(
        { message: 'orderId와 paymentKey가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!isVIPSignupOrderId(orderId)) {
      return NextResponse.json(
        { message: 'VIP 신규 가입 결제가 아닙니다.' },
        { status: 400 }
      )
    }

    const redisKey = `payment:toss:signup:${orderId}`
    const raw = await redis.get(redisKey)

    if (!raw) {
      return NextResponse.json(
        { message: '결제 주문 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const order = JSON.parse(raw)

    if (order.flowType !== 'VIP_SIGNUP') {
      return NextResponse.json(
        { message: '결제 플로우 정보가 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    if (order.status === 'ACTIVATED' && order.firebaseUid) {
      const customToken = await adminAuth.createCustomToken(order.firebaseUid)

      return NextResponse.json({
        ok: true,
        alreadyActivated: true,
        uid: order.firebaseUid,
        email: order.firebaseEmail || order.email || null,
        vipLevel: 'VIP',
        customToken,
      })
    }

    if (order.status !== 'DONE') {
      return NextResponse.json(
        { message: '결제가 완료되지 않았습니다.' },
        { status: 400 }
      )
    }

    if (order.paymentKey !== paymentKey) {
      return NextResponse.json(
        { message: 'paymentKey가 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    if (!order.email || !order.encryptedPassword) {
      return NextResponse.json(
        { message: '계정 생성 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const password = decryptPassword(order.encryptedPassword)
    const firebaseUser = await createOrGetFirebaseUser(order.email, password)

    await setUserVIPLevel(firebaseUser.uid, 'VIP')

    const customToken = await adminAuth.createCustomToken(firebaseUser.uid)

    const activatedAt = new Date().toISOString()

    const activatedOrder = {
      ...order,
      status: 'ACTIVATED',
      firebaseUid: firebaseUser.uid,
      firebaseEmail: firebaseUser.email || order.email,
      encryptedPassword: null,
      activatedAt,
    }

    await redis.set(
      redisKey,
      JSON.stringify(activatedOrder),
      'EX',
      60 * 60 * 24 * 365
    )

    await redis.set(
      `vip:activation:${firebaseUser.uid}`,
      JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email || order.email,
        level: 'VIP',
        source: 'VIP_SIGNUP_TOSS',
        orderId,
        paymentKey,
        activatedAt,
      }),
      'EX',
      60 * 60 * 24 * 365
    )

    return NextResponse.json({
      ok: true,
      alreadyActivated: false,
      uid: firebaseUser.uid,
      email: firebaseUser.email || order.email,
      vipLevel: 'VIP',
      customToken,
    })
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || 'VIP 활성화 실패' },
      { status: 500 }
    )
  }
}
