import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { email } = body

  if (!email) {
    return NextResponse.json(
      { error: 'Email required' },
      { status: 400 }
    )
  }

  const res = NextResponse.json({ ok: true })

  // 🔥 테스트용: email을 userId로 저장
  res.cookies.set('userId', email, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })

  return res
}
