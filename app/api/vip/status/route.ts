// app/api/vip/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)

  if (!user) {
    return NextResponse.json(
      { isVip: false, level: 'FREE' },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    )
  }

  const level = await getUserVIPLevel(user.id)

  return NextResponse.json(
    {
      isVip: level === 'VIP',
      level,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  )
}
