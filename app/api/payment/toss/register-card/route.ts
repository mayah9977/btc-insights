import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createPendingPayment } from '@/lib/toss/paymentDB'
import { getVIPPlan, isVIPPlan } from '@/lib/payment/vipPlans'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)

  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 },
    )
  }

  const body = await req.json()
  const plan = body.plan

  if (!isVIPPlan(plan)) {
    return NextResponse.json(
      { error: 'Invalid plan' },
      { status: 400 },
    )
  }

  const config = getVIPPlan(plan)
  const orderId = `vip_${user.id}_${Date.now()}_${randomUUID()
    .replace(/-/g, '')
    .slice(0, 12)}`

  const customerKey = `customer_${user.id}`

  await createPendingPayment({
    orderId,
    userId: user.id,
    plan,
    amount: config.amount,
  })

  return NextResponse.json({
    clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
    customerKey,
    orderId,
    orderName: config.orderName,
    amount: config.amount,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/ko/vip/success`,
    failUrl: `${process.env.NEXT_PUBLIC_APP_URL}/ko/vip/fail`,
  })
}
