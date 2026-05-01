// app/api/debug/vip/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUserVIPState, setVIP, isVIP } from '@/lib/vip/vipDB'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const userId =
    typeof body.userId === 'string' ? body.userId : 'test-user'

  await setVIP(userId, 30)

  const state = await getUserVIPState(userId)
  const valid = await isVIP(userId)

  return NextResponse.json({
    ok: true,
    isVip: valid,
    state,
  })
}
