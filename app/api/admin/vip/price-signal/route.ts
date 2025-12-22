import { NextResponse } from 'next/server';
import { analyzePriceIncreaseTiming } from '@/lib/vip/vipPriceSignal';

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  return NextResponse.json({
    userId,
    signal: analyzePriceIncreaseTiming(userId),
  });
}
