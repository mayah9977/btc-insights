import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const email = typeof body.email === 'string' ? body.email : null

  if (!email) {
    return NextResponse.json(
      { error: 'Email required' },
      { status: 400 },
    )
  }

  const res = NextResponse.json({
    ok: true,
    userId: email,
  })

  res.cookies.set('userId', email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return res
}
