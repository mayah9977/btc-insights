//app/api/vip/toss/confirm/route.ts   

import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis/index'
import { isVIPSignupOrderId } from '@/lib/payments/orderId'
import { confirmTossPayment, TossPaymentError } from '@/lib/payments/tossClient'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ConfirmVIPSignupPaymentBody = {
  paymentKey?: string
  orderId?: string
  amount?: number | string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ConfirmVIPSignupPaymentBody
    const paymentKey = body.paymentKey
    const orderId = body.orderId
    const amount = Number(body.amount)

    if (!paymentKey || !orderId || !Number.isFinite(amount)) {
      return NextResponse.json(
        { message: 'paymentKey, orderId, amount가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!isVIPSignupOrderId(orderId)) {
      return NextResponse.json(
        { message: 'VIP 신규 가입 결제 orderId가 아닙니다.' },
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

    if (Number(order.amount) !== amount) {
      return NextResponse.json(
        { message: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    if (order.status === 'DONE' || order.status === 'ACTIVATED') {
      return NextResponse.json({
        ok: true,
        alreadyConfirmed: true,
        flowType: 'VIP_SIGNUP',
        orderId,
        paymentKey: order.paymentKey || paymentKey,
        status: order.status,
      })
    }

    const payment = await confirmTossPayment({
      paymentKey,
      orderId,
      amount,
    })

    if (payment.orderId !== orderId) {
      return NextResponse.json(
        { message: 'Toss 결제 응답의 orderId가 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    if (payment.paymentKey !== paymentKey) {
      return NextResponse.json(
        { message: 'Toss 결제 응답의 paymentKey가 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    if (Number(payment.totalAmount) !== amount) {
      return NextResponse.json(
        { message: 'Toss 결제 응답의 금액이 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    if (payment.status !== 'DONE') {
      return NextResponse.json(
        { message: '결제가 완료 상태가 아닙니다.', status: payment.status },
        { status: 400 }
      )
    }

    await redis.set(
      redisKey,
      JSON.stringify({
        ...order,
        status: 'DONE',
        paymentKey,
        payment,
        confirmedAt: new Date().toISOString(),
      }),
      'EX',
      60 * 60 * 24 * 30
    )

    return NextResponse.json({
      ok: true,
      flowType: 'VIP_SIGNUP',
      orderId,
      paymentKey,
      status: 'DONE',
    })
  } catch (e: any) {
    if (e instanceof TossPaymentError) {
      return NextResponse.json(
        {
          message: e.message,
          code: e.code,
          response: e.response,
        },
        { status: e.status || 400 }
      )
    }

    return NextResponse.json(
      { message: e?.message || 'Toss 결제 승인 실패' },
      { status: 500 }
    )
  }
}
