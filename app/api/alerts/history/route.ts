import { NextResponse } from 'next/server'
import { listAlertHistories } from '@/lib/alerts/alertHistoryStore'

// ⚠️ 실제 서비스에서는 session/userId 연동
const DEV_USER_ID = 'dev-user'

export async function GET() {
  const data = await listAlertHistories(DEV_USER_ID)
  return NextResponse.json(data)
}
