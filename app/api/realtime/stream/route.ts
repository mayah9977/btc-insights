// app/api/realtime/stream/route.ts

import { NextRequest } from 'next/server';
import { addSSEClient } from '@/lib/realtime/sseHub';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const cleanup = addSSEClient(controller);

      // 클라이언트 종료 시 정리
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
