import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis/index'


export async function POST() {
  try {
    await redis.del('alerts')
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[RESET_ALERTS]', e)
    return NextResponse.json(
      { ok: false },
      { status: 500 }
    )
  }
}
