import { NextRequest, NextResponse } from 'next/server';
import { saveUserVIP, downgradeUserVIP } from '@/lib/vip/vipDB';

export async function POST(req: NextRequest) {
  const { userId, action, priceId } = await req.json();

  if (action === 'expire') {
    await downgradeUserVIP(userId);
  }

  if (action === 'recover' && priceId) {
    await saveUserVIP(userId, priceId);
  }

  return NextResponse.json({ ok: true });
}
