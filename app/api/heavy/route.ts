import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getUserVIPLevel } from '@/lib/vip/vipServer'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const vipLevel = await getUserVIPLevel(user.id)

  /**
   * 접근 정책
   * - VIP만 통과
   */
  if (vipLevel !== 'VIP') {
    return NextResponse.json(
      {
        error: 'VIP only API',
      },
      { status: 403 },
    )
  }

  // 실제 heavy 작업 (예시)
  return NextResponse.json({
    ok: true,
    message: 'Heavy API executed',
  })
}
