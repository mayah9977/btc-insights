// app/api/diagnostics/vip-source/route.ts

import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { isAdminUser } from '@/lib/auth/adminAccess'
import { isVIP as isUserVIPActive } from '@/lib/vip/vipDB'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate, proxy-revalidate',
}

export async function GET() {
  try {
    const currentUser =
      await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        {
          error: 'UNAUTHENTICATED',
        },
        {
          status: 401,
          headers: NO_STORE_HEADERS,
        },
      )
    }

    const [
      adminOverrideMatched,
      validVipRowExists,
    ] = await Promise.all([
      isAdminUser(
        currentUser.id,
        currentUser.email,
      ),
      isUserVIPActive(
        currentUser.id,
      ),
    ])

    return NextResponse.json(
      {
        adminOverrideMatched,
        validVipRowExists,
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      },
    )
  } catch {
    return NextResponse.json(
      {
        error: 'DIAGNOSTIC_FAILED',
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      },
    )
  }
}
