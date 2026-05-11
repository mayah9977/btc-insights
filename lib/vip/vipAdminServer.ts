import { forceExpireVIP, recoverVIP } from './vipDB'
import type { VIPLevel } from './vipTypes'

/** 🔥 Admin Override */
export async function adminSetVIPLevel(
  userId: string,
  level: VIPLevel,
) {
  await recoverVIP(userId, level, 30)
}

/** ❌ 강제 만료 */
export async function adminExpireVIP(userId: string) {
  await forceExpireVIP(userId)
}

/** 🔁 복구 */
export async function adminRecoverVIP(
  userId: string,
  priceId: string,
) {
  const level = priceId === 'YEAR' ? 'VIP' : 'VIP'
  await recoverVIP(userId, level, 30)
}
