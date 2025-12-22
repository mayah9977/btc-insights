import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type Client = {
  controller: ReadableStreamDefaultController;
};

let clients: Client[] = [];

const encoder = new TextEncoder();

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const client: Client = { controller };
      clients.push(client);

      console.log('[SSE] client connected. total:', clients.length);

      const cleanup = () => {
        clients = clients.filter((c) => c !== client);
        console.log('[SSE] client disconnected. total:', clients.length);
      };

      req.signal.addEventListener('abort', cleanup);
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

/** 🔥 서버에서 호출하는 push 함수 */
export function pushRealtimeUpdate(payload: any) {
  const message = encoder.encode(
    `data: ${JSON.stringify(payload)}\n\n`
  );

  clients = clients.filter(({ controller }) => {
    try {
      controller.enqueue(message);
      return true;
    } catch (err) {
      // ❌ 이미 닫힌 controller → 제거
      console.warn('[SSE] drop closed client');
      return false;
    }
  });
}
