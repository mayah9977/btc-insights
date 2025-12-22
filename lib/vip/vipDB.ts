// lib/vip/vipDB.ts
import type { VIPLevel, VIPAddon } from './vipTypes';
import { appendAudit } from './vipAuditStore';

/**
 * VIP 상태 타입
 */
export type VIPState = {
  level: VIPLevel;
  expiredAt: number;        // timestamp(ms)
  updatedAt: number;        // timestamp(ms)
  priceId?: string;

  /**
   * VIP Add-ons
   * - addonKey -> expireAt timestamp(ms)
   */
  addons?: {
    [key in VIPAddon]?: number;
  };
};

/**
 * DEV 전용 인메모리 DB
 * - 운영 시 DB/Firebase/Prisma로 교체
 * - 함수 시그니처 유지 권장
 */
const mem = new Map<string, VIPState>();

/**
 * VIP 자동 연장 옵션 (유료)
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

  // dev fallback
  return 'VIP1';
}

/**
 * ✅ 결제 성공 → VIP 저장
 * - 기본 30일
 */
export async function saveUserVIP(userId: string, priceId: string) {
  const now = Date.now();
  const level = priceIdToLevel(priceId);

  mem.set(userId, {
    level,
    priceId,
    expiredAt: now + 1000 * 60 * 60 * 24 * 30,
    updatedAt: now,
    addons: mem.get(userId)?.addons, // 🔥 Add-on 유지
  });

  appendAudit({
    userId,
    before: 'FREE',
    after: level,
    reason: 'PAYMENT',
    at: now,
  });
}

/**
 * 🔥 구독 취소 / 다운그레이드
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
 * ♻️ VIP 연장
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

  mem.set(userId, {
    level,
    expiredAt: now + days * 86400000,
    updatedAt: now,
    addons: mem.get(userId)?.addons, // 🔥 Add-on 유지
  });

  appendAudit({
    userId,
    before: 'FREE',
    after: level,
    reason: 'ADMIN',
    at: now,
  });
}

/**
 * 🔍 VIP 상태 조회 (SSOT)
 */
export async function getUserVIPState(
  userId: string
): Promise<VIPState | null> {
  return mem.get(userId) ?? null;
}
