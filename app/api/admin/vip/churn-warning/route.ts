import { NextResponse } from 'next/server';
import { predictVIP3Churn } from '@/lib/vip/vipChurnPredictor';

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  return NextResponse.json({
    userId,
    risk: predictVIP3Churn(userId),
  });
}
