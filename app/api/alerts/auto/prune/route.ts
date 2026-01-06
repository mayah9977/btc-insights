import { NextResponse } from 'next/server'
import { autoPruneAlerts } from '@/lib/alerts/alertAutoPruner'

const DEV_USER_ID = 'dev-user'

export async function POST() {
  const pruned = await autoPruneAlerts(DEV_USER_ID)
  return NextResponse.json({ pruned })
}
