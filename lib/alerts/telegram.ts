import { getTelegramChatId } from './telegramStore';

export async function sendTelegram(userId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[Telegram] env missing TELEGRAM_BOT_TOKEN');
    return;
  }

  const chatId = await getTelegramChatId(userId);
  if (!chatId) {
    console.warn('[Telegram] no chatId mapped for user:', userId);
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
}
