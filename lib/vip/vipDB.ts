// lib/vip/vipDB.ts
import type { VIPLevel, VIPAddon } from './vipTypes';
import { appendAudit } from './vipAuditStore';

/**
 * VIP 상태 타입 (SSOT)
 */
export type VIPState = {
  level: VIPLevel;
  expiredAt: number; // timestamp(ms)
  updatedAt: number; // timestamp(ms)
  priceId?: string;

  /**
   * VIP Add-ons
   * addonKey -> expireAt timestamp(ms)
   */
  addons?: {
    [key in VIPAddon]?: number;
  };
};

/**
 * DEV 전용 인메모리 DB
 * - 운영 시 DB / Prisma / Redis 교체
 * - 시그니처 유지
 */
const mem = new Map<string, VIPState>();

/**
 * VIP 자동 연장 옵션
 */
const autoExtendOption = new Map<string, number>();

/**
 * Stripe priceId → VIPLevel 매핑
 */
function priceIdToLevel(priceId: string): VIPLevel {
  const vip1 = process.env.STRIPE_PRICE_VIP1;
  const vip2 = process.env.STRIPE_PRICE_VIP2;
  const vip3 = process.env.STRIPE_PRICE_VIP3;

  if (vip3 && priceId === vip3) return 'VIP3';
  if (vip2 && priceId === vip2) return 'VIP2';
  if (vip1 && priceId === vip1) return 'VIP1';

  return 'VIP1'; // dev fallback
}

/**
 * 🔍 VIP 상태 조회 (SSOT)
 */
export async function getUserVIPState(
  userId: string
): Promise<VIPState | null> {
  return mem.get(userId) ?? null;
}

/**
 * ✅ VIP 상태 직접 설정 (SSOT Setter)
 * - vipService / webhook에서 사용
 */
export async function setUserVIPState(
  userId: string,
  next: VIPState,
  reason: 'PAYMENT' | 'ADMIN' | 'RECOVER'
) {
  const prev = mem.get(userId);
  const before = prev?.level ?? 'FREE';

  mem.set(userId, next);

  appendAudit({
    userId,
    before,
    after: next.level,
    reason,
    at: Date.now(),
  });
}

/**
 * ✅ 결제 성공 → VIP 저장 (30일)
 */
export async function saveUserVIP(userId: string, priceId: string) {
  const now = Date.now();
  const level = priceIdToLevel(priceId);
  const prev = mem.get(userId);

  mem.set(userId, {
    level,
    priceId,
    expiredAt: now + 30 * 86400000,
    updatedAt: now,
    addons: prev?.addons,
  });

  appendAudit({
    userId,
    before: prev?.level ?? 'FREE',
    after: level,
    reason: 'PAYMENT',
    at: now,
  });
}

/**
 * 🔥 구독 취소 / 즉시 만료
 */
export async function downgradeUserVIP(userId: string) {
  const prev = mem.get(userId);
  if (!prev) return;

  const now = Date.now();

  mem.set(userId, {
    ...prev,
    expiredAt: now,
    updatedAt: now,
  });

  appendAudit({
    userId,
    before: prev.level,
    after: prev.level,
    reason: 'CANCEL',
    at: now,
  });
}

/**
 * ♻️ VIP 기간 연장
 */
export async function extendVIP(userId: string, days: number) {
  const prev = mem.get(userId);
  if (!prev) return;

  const now = Date.now();

  mem.set(userId, {
    ...prev,
    expiredAt: prev.expiredAt + days * 86400000,
    updatedAt: now,
  });

  appendAudit({
    userId,
    before: prev.level,
    after: prev.level,
    reason: 'EXTEND',
    at: now,
  });
}

/**
 * 💎 VIP 자동 연장 옵션 활성화
 */
export async function enableAutoExtend(userId: string, days: number) {
  autoExtendOption.set(userId, days);
}

/**
 * 🔁 만료 시 자동 연장 적용
 */
export async function applyAutoExtendIfEnabled(userId: string) {
  const days = autoExtendOption.get(userId);
  if (!days) return;
  await extendVIP(userId, days);
}

/**
 * ❌ 강제 만료 (Admin)
 */
export async function forceExpireVIP(userId: string) {
  const prev = mem.get(userId);
  if (!prev) return;

  const now = Date.now();

  mem.set(userId, {
    ...prev,
    expiredAt: now,
    updatedAt: now,
  });

  appendAudit({
    userId,
    before: prev.level,
    after: prev.level,
    reason: 'EXPIRE',
    at: now,
  });
}

/**
 * 🔄 VIP 복구 (Admin Recover)
 */
export async function recoverVIP(
  userId: string,
  level: VIPLevel,
  days: number
) {
  const now = Date.now();
  const prev = mem.get(userId);

  mem.set(userId, {
    level,
    expiredAt: now + days * 86400000,
    updatedAt: now,
    addons: prev?.addons,
  });

  appendAudit({
    userId,
    before: prev?.level ?? 'FREE',
    after: level,
    reason: 'ADMIN',
    at: now,
  });
}
