import { NextRequest, NextResponse } from 'next/server'
import { expireOverdueVIPs } from '@/lib/vip/vipDB'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 },
    )
  }

  try {
    const expiredCount = await expireOverdueVIPs()

    logger.info('[VIP EXPIRE CRON SUCCESS]', {
      expiredCount,
    })

    return NextResponse.json({
      ok: true,
      expiredCount,
    })
  } catch (error) {
    logger.error('[VIP EXPIRE CRON FAILED]', {
      error:
        error instanceof Error
          ? error.message
          : 'Unknown expire cron error',
    })

    return NextResponse.json(
      { error: 'VIP expire cron failed' },
      { status: 500 },
    )
  }
}
