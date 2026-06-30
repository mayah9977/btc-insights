//app/api/payment/vip-success/route.ts  

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { userId, vipLevel } = await req.json()
  const { handleVIPPaymentSuccess } = await import('@/lib/vip/vipPayment')

  await handleVIPPaymentSuccess(userId, vipLevel)

  return NextResponse.json({ ok: true })
}
