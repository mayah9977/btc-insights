// app/api/dev-login/route.ts
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { redis } from '@/lib/redis/index'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, {
      status: 404,
    })
  }

  try {
    const sessionId = randomUUID()

    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({
        userId: 'dev-user',
        email: 'dev@local.test',
        isDev: true,
        isAdmin: true,
        createdAt: Date.now(),
      }),
      'EX',
      60 * 60 * 24 * 30,
    )

    const res = NextResponse.json({
      ok: true,
      user: {
        id: 'dev-user',
        email: 'dev@local.test',
        isDev: true,
        isAdmin: true,
        isVIP: true,
      },
    })

    res.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return res
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Dev 로그인 실패' },
      { status: 500 },
    )
  }
}
