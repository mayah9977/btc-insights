//app/api/telegram/link/route.ts

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { setTelegramChatId } from '@/lib/alerts/telegramStore';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { isVIP } from '@/lib/vip/vipServer';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const rawChatId =
    typeof body === 'object' &&
    body !== null &&
    'chatId' in body
      ? body.chatId
      : null;

  const chatId =
    typeof rawChatId === 'string'
      ? rawChatId.trim()
      : '';

  if (!chatId) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_CHAT_ID',
      },
      {
        status: 400,
      },
    );
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      {
        ok: false,
        error: 'UNAUTHORIZED',
      },
      {
        status: 401,
      },
    );
  }

  const vipActive = await isVIP(
    currentUser.id,
  );

  if (!vipActive) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VIP_REQUIRED',
      },
      {
        status: 403,
      },
    );
  }

  await setTelegramChatId(
    currentUser.id,
    chatId,
  );

  return NextResponse.json({ ok: true });
}
