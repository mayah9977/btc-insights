import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'

import {
  getUserVIPState,
  isVIP,
} from '@/lib/vip/vipDB'

import { logger } from '@/lib/logger'

export async function POST(
  req: NextRequest,
) {
  try {
    /**
     * 최신 auth 구조:
     * req 전달 제거
     */
    const user =
      await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: 'UNAUTHORIZED',
        },
        {
          status: 401,
        },
      )
    }

    /**
     * VIP 상태 조회
     */
    const vipState =
      await getUserVIPState(user.id)

    if (!vipState) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'NO_VIP_RECORD',
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
     * 실제 VIP 유효 여부 확인
     */
    const valid = await isVIP(
      user.id,
    )

    return NextResponse.json(
      {
        ok: valid,
        level: vipState.level,
        expiredAt:
          vipState.expiredAt,
        graceUntil:
          vipState.graceUntil,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    logger.error(
      '[VIP RECOVER FAILED]',
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unknown recover error',
      },
    )

    return NextResponse.json(
      {
        ok: false,
        error: 'VIP recover failed',
      },
      {
        status: 500,
      },
    )
  }
}
