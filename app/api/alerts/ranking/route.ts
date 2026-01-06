import { NextResponse } from 'next/server'
import { rankAlerts } from '@/lib/alerts/alertRanking'

const DEV_USER_ID = 'dev-user'

export async function GET() {
  return NextResponse.json(
    await rankAlerts(DEV_USER_ID)
  )
}
