import { NextResponse } from 'next/server'
import { recoverVIPFromStripe } from '@/lib/vip/recoverFromStripe'

export async function GET() {
  const users = ['user1', 'user2'] // 실제 DB 조회

  for (const userId of users) {
    await recoverVIPFromStripe(userId)
  }

  return NextResponse.json({ ok: true })
}
