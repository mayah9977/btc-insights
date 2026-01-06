import { NextResponse } from 'next/server'
import { listPerformances } from '@/lib/alerts/alertPerformanceStore'

const DEV_USER_ID = 'dev-user'

export async function GET() {
  return NextResponse.json(
    await listPerformances(DEV_USER_ID)
  )
}
