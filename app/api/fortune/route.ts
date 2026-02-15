import { NextResponse } from 'next/server'
import { generateTodayFortune } from '@/lib/fortune/fortuneEngine'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const birth = searchParams.get('birth')

  if (!birth) {
    return NextResponse.json(
      { error: 'Birth date required' },
      { status: 400 },
    )
  }

  const fortune = generateTodayFortune(birth)

  return NextResponse.json(fortune)
}
