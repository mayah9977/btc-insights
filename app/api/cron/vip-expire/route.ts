import { NextResponse } from 'next/server';
import {
  getUserVIPState,
  applyAutoExtendIfEnabled,
} from '@/lib/vip/vipDB';

import { resolveVIPWithGrace } from '@/lib/vip/vipGrace';

/**
 * DEV 기준: mem Map 전체 순회
 * 운영 시: DB 쿼리
 */
export async function GET() {
  const now = Date.now();

  // ⚠️ DEV 전용 접근 (mem 직접 접근 불가 → 구조상 예시)
  const users = (global as any).__VIP_USERS__ as string[] | undefined;
  if (!users) return NextResponse.json({ skipped: true });

  for (const userId of users) {
    const state = await getUserVIPState(userId);
    if (!state) continue;

    if (state.expiredAt < now) {
      // 1️⃣ 자동 연장 옵션 적용
      await applyAutoExtendIfEnabled(userId);

      // 2️⃣ Grace 이후 FREE 판단은 SSOT에서 처리
      resolveVIPWithGrace(state);
    }
  }

  return NextResponse.json({ ok: true });
}
