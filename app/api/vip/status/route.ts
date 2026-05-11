// app/api/vip/status/route.ts
import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { getUserVIPLevel } from '@/lib/vip/vipServer'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export const dynamic = 'force-dynamic'

export const revalidate = 0

/**
 * VIP 상태 조회
 */
export async function GET(
  req: NextRequest,
) {
  /**
   * 최신 auth 구조:
   * req 전달 제거
   */
  const user =
    await getCurrentUser()

  /**
   * 비로그인 상태
   */
  if (!user) {
    return NextResponse.json(
      {
        isVip: false,
        level: 'FREE',
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  }

  /**
   * VIP 레벨 조회
   */
  const level =
    await getUserVIPLevel(user.id)

  return NextResponse.json(
    {
      isVip: level === 'VIP',
      level,
    },
    {
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate',
      },
    },
  )
}
