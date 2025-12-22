import { NextResponse } from 'next/server';
import { assignPriceGroup } from '@/lib/vip/vipPriceExperiment';

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId required' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    userId,
    group: assignPriceGroup(userId),
  });
}
