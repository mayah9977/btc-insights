export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { setTelegramChatId } from '@/lib/alerts/telegramStore';

export async function POST(req: Request) {
  const body = await req.json();
  const userId = body.userId ?? 'dev-user';
  const chatId = body.chatId as string;

  if (!chatId) return NextResponse.json({ ok: false, error: 'Missing chatId' }, { status: 400 });

  await setTelegramChatId(userId, chatId);
  return NextResponse.json({ ok: true });
}
