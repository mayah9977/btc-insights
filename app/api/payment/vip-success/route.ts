import { NextResponse } from 'next/server'
import { handleVIPPaymentSuccess } from '@/lib/vip/vipPayment'

export async function POST(req: Request) {
  const { userId, vipLevel } = await req.json()

  await handleVIPPaymentSuccess(userId, vipLevel)

  return NextResponse.json({ ok: true })
}
