//app/api/alerts/auto/prune/route.ts

import { NextResponse } from 'next/server'
import { autoPruneAlerts } from '@/lib/alerts/alertAutoPruner'

const DEV_USER_ID = 'dev-user'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, {
      status: 404,
    })
  }

  const pruned = await autoPruneAlerts(DEV_USER_ID)

  return NextResponse.json({ pruned })
}
