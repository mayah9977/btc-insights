// lib/vip/vipServer.ts
import type { VIPLevel } from './vipTypes'
import { getAdminVIP } from './vipAdmin'
import { getUserVIPState } from './vipDB'

export async function getUserVIPLevel(userId: string): Promise<VIPLevel> {
  const adminVIP = getAdminVIP(userId)
  if (adminVIP) return adminVIP

  const vipState = await getUserVIPState(userId)
  if (!vipState) return 'FREE'

  const now = Date.now()

  const isActiveVip =
    vipState.level === 'VIP' && vipState.expiredAt > now

  const isGraceVip =
    vipState.graceUntil !== null && vipState.graceUntil > now

  if (isActiveVip || isGraceVip) return 'VIP'

  return 'FREE'
}
