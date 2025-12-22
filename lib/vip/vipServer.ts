// lib/vip/vipServer.ts
import type { VIPLevel } from './vipTypes';
import { getAdminVIP } from './vipAdmin';
import { resolveVIPWithGrace } from './vipGrace';
import { getUserVIPState } from './vipDB';

/**
 * VIP Single Source of Truth (SSOT)
 *
 * ✅ VIP 결정 우선순위
 * 1️⃣ Admin Override (운영자 강제 설정)
 * 2️⃣ 결제 / DB 기반 VIP + Grace Period
 * 3️⃣ 기본값 (FREE)
 *
 * ⚠️ Stripe/DB를 교체해도 "이 구조"는 유지하세요.
 * - 교체 포인트는 getUserVIPState()/saveUserVIP()의 내부 구현입니다.
 */
export async function getUserVIPLevel(userId: string): Promise<VIPLevel> {
  /** 1️⃣ Admin Override (최우선) */
  const adminVIP = getAdminVIP(userId);
  if (adminVIP) return adminVIP;

  /** 2️⃣ 결제 / DB 기반 VIP 상태 + Grace */
  const vipStateFromDB = await getUserVIPState(userId);

  if (vipStateFromDB) {
    return resolveVIPWithGrace({
      level: vipStateFromDB.level,
      expiredAt: vipStateFromDB.expiredAt,
    });
  }

  /** 3️⃣ 기본값 */
  return 'FREE';
}
