import { NextResponse } from 'next/server';
import { triggerVIP3Compensation } from '@/lib/vip/vipCompensation';

export async function POST(req: Request) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json(
      { error: 'userId required' },
      { status: 400 }
    );
  }

  const action = await triggerVIP3Compensation(userId);

  return NextResponse.json({
    userId,
    action,
  });
}
