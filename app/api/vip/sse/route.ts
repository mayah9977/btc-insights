import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

let clients: ReadableStreamDefaultController[] = [];

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      clients.push(controller);

      req.signal.addEventListener('abort', () => {
        clients = clients.filter((c) => c !== controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/** 🔥 VIP 변경 시 호출 */
export function pushVIPUpdate(userId: string, vipLevel: string) {
  const payload = `data: ${JSON.stringify({ userId, vipLevel })}\n\n`;
  clients.forEach((c) => c.enqueue(payload));
}
