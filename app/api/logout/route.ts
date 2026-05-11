// app/api/logout/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { redis } from '@/lib/redis/index'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session')?.value

    if (sessionId) {
      await redis.del(`session:${sessionId}`)
    }

    const res = NextResponse.json({
      ok: true,
    })

    res.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return res
  } catch (error) {
    console.error('[API_LOGOUT]', error)

    return NextResponse.json(
      { ok: false, message: '로그아웃 실패' },
      { status: 500 },
    )
  }
}
