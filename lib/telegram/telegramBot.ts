import TelegramBot, {
  Message,
  CallbackQuery,
} from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN!;
if (!token) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN');
}

// polling = Worker / Node 전용
export const telegramBot = new TelegramBot(token, {
  polling: true,
});

/**
 * 📩 기본 메시지 수신
 */
telegramBot.on('message', (msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text ?? '';

  console.log('[Telegram]', chatId, text);

  if (text === '/start') {
    telegramBot.sendMessage(
      chatId,
      '🚀 알림 봇이 연결되었습니다.'
    );
  }
});

/**
 * 🔘 버튼 콜백
 */
telegramBot.on(
  'callback_query',
  (query: CallbackQuery) => {
    if (!query.message) return;

    const chatId = query.message.chat.id;
    const data = query.data;

    telegramBot.sendMessage(
      chatId,
      `선택됨: ${data}`
    );
  }
);
