import { NextResponse } from 'next/server'
import { recommendVolatilityAlert } from '@/lib/ai/volatilityAlert'

export async function POST(req: Request) {
  const { prices } = await req.json()
  const result = recommendVolatilityAlert(prices)
  return NextResponse.json(result)
}
