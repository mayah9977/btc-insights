//app/api/alerts/ai/auto/route.ts

import { NextResponse } from 'next/server'
import { autoCreateVolatilityAlert } from '@/lib/ai/autoAlertGenerator'

const DEV_USER_ID = 'dev-user'

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, {
      status: 404,
    })
  }

  const { symbol, prices } = await req.json()

  const alert =
    await autoCreateVolatilityAlert({
      userId: DEV_USER_ID,
      symbol,
      prices,
    })

  return NextResponse.json({
    created: !!alert,
    alert,
  })
}
