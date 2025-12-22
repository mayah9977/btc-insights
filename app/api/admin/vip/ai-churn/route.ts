import { NextResponse } from 'next/server';
import { predictChurnWithAI } from '@/lib/vip/vipAIChurnModel';

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId required' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    predictChurnWithAI(userId)
  );
}
