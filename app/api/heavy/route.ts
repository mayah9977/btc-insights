// app/api/heavy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserVIPLevel } from '@/lib/vip/vipServer';

/**
 * 고부하 API 예시
 * - VIP3: Rate Limit 해제
 * - VIP1/VIP2/FREE: 제한 적용
 */
export async function GET(req: NextRequest) {
  /**
   * ⚠️ 실제 서비스에서는
   * - cookie
   * - session
   * - JWT
   * 등에서 userId를 꺼내야 함
   */
  const userId = req.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 🔑 VIP 판단 (SSOT)
  const vipLevel = await getUserVIPLevel(userId);

  /**
   * 🚦 Rate Limit
   * - VIP3만 통과
   */
  if (vipLevel !== 'VIP3') {
    return NextResponse.json(
      {
        error: 'VIP3 only API',
        currentVIP: vipLevel,
      },
      { status: 403 }
    );
  }

  /**
   * ✅ VIP3 전용 고부하 처리
   * (실제 로직은 여기 교체)
   */
  return NextResponse.json({
    ok: true,
    vip: vipLevel,
    data: {
      signal: 'EXTREME_WHALE_ACTIVITY',
      confidence: 0.97,
      generatedAt: Date.now(),
    },
  });
}
