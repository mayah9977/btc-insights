import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getUserVIPState, isVIP } from '@/lib/vip/vipDB'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'UNAUTHORIZED' },
        { status: 401 },
      )
    }

    const vipState = await getUserVIPState(user.id)

    if (!vipState) {
      return NextResponse.json(
        { ok: false, reason: 'NO_VIP_RECORD' },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        },
      )
    }

    const valid = await isVIP(user.id)

    return NextResponse.json(
      {
        ok: valid,
        level: vipState.level,
        expiredAt: vipState.expiredAt,
        graceUntil: vipState.graceUntil,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    logger.error('[VIP RECOVER FAILED]', {
      error:
        error instanceof Error
          ? error.message
          : 'Unknown recover error',
    })

    return NextResponse.json(
      { ok: false, error: 'VIP recover failed' },
      { status: 500 },
    )
  }
}
