// app/api/notification/register-push-token/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { claimUserPushToken, getUserPushTokens } from '@/lib/push/pushStore'
import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'
import { resolveAdminNotificationTargetUserIds } from '@/lib/auth/adminNotificationTargetResolver'
import { getAllValidVIPUserIds } from '@/lib/vip/vipDB'

/**
 * Client → Server Push Token Register
 * 서버 principal 기반 token 소유권 등록
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (
      typeof token !== 'string' ||
      !token.trim()
    ) {
      return NextResponse.json(
        { ok: false, error: 'TOKEN_REQUIRED' },
        { status: 400 },
      )
    }

    const principal =
      await resolveNotificationPrincipal()

    await claimUserPushToken(
      principal.userId,
      token.trim(),
    )

    let institutionalFanoutTarget: boolean | null = null
    let principalTokenCountAfterClaim: number | null = null

    const [
      institutionalFanoutTargetResult,
      principalTokenCountAfterClaimResult,
    ] = await Promise.allSettled([
      (async () => {
        const validVipUserIds =
          await getAllValidVIPUserIds()
        const adminTargetResolution =
          await resolveAdminNotificationTargetUserIds()

        return new Set([
          ...validVipUserIds,
          ...adminTargetResolution.userIds,
        ]).has(principal.userId)
      })(),
      (async () => {
        const tokens = await getUserPushTokens(
          principal.userId,
        )

        return tokens.length
      })(),
    ])

    if (
      institutionalFanoutTargetResult.status ===
      'fulfilled'
    ) {
      institutionalFanoutTarget =
        institutionalFanoutTargetResult.value
    }

    if (
      principalTokenCountAfterClaimResult.status ===
      'fulfilled'
    ) {
      principalTokenCountAfterClaim =
        principalTokenCountAfterClaimResult.value
    }

    return NextResponse.json({
      ok: true,
      principalKind: principal.kind,
      principalIsAdmin:
        principal.kind === 'authenticated'
          ? principal.isAdmin
          : false,
      institutionalFanoutTarget,
      principalTokenCountAfterClaim,
      claimedTokenOwnedByPrincipal: true,
    })
  } catch (err) {
    console.error('[API] registerPushToken error', err)

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    )
  }
}
