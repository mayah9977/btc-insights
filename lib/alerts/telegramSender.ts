// lib/alerts/telegramSender.ts
export async function sendTelegram(
  chatId: string,
  text: string
) {
  const url = `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
