import { NextRequest, NextResponse } from 'next/server';
import { extendVIP } from '@/lib/vip/vipDB';

export async function POST(req: NextRequest) {
  const { userId, days } = await req.json();
  await extendVIP(userId, days);
  return NextResponse.json({ ok: true });
}
