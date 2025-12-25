// app/api/cron/vip-expire/route.ts
import { NextResponse } from 'next/server';
import {
  getUserVIPState,
  applyAutoExtendIfEnabled,
} from '@/lib/vip/vipDB';
import { expireUserVip } from '@/lib/vip/vipService';
import { isVIPInGracePeriod } from '@/lib/vip/vipGrace';

/**
 * ⏰ VIP 만료 Cron
 * AutoExtend → Grace → Expire
 */
export async function GET() {
  const now = Date.now();

  /**
   * DEV ONLY
   * PROD: DB 쿼리로 교체
   */
  const users = (global as any).__VIP_USERS__ as string[] | undefined;
  if (!users) {
    return NextResponse.json({ skipped: true });
  }

  for (const userId of users) {
    let state = await getUserVIPState(userId);
    if (!state) continue;

    // 아직 유효
    if (state.expiredAt > now) continue;

    // 1️⃣ 자동 연장
    await applyAutoExtendIfEnabled(userId);

    // 재조회
    state = await getUserVIPState(userId);
    if (!state) continue;

    if (state.expiredAt > now) continue;

    // 2️⃣ Grace Period
    if (isVIPInGracePeriod(state)) continue;

    // 3️⃣ 최종 만료
    await expireUserVip(userId);
  }

  return NextResponse.json({ ok: true });
}
