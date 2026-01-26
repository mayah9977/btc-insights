import { NextResponse } from 'next/server'
import { getLatestRiskEvent } from '@/lib/vip/redis/getLatestRiskEvent'

export const runtime = 'nodejs'

export async function GET() {
  const event = await getLatestRiskEvent()
  return NextResponse.json(event)
}
