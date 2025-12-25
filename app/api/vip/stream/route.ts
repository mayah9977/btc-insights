export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { addVipClient } from '@/lib/vip/vipSSEHub';

type VipPayload =
  | { type: 'vip'; vipLevel: string }
  | { type: 'heartbeat' };

const encoder = new TextEncoder();

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');

  if (!userId) {
    return new Response('Missing userId', { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const remove = addVipClient(userId, controller);

      // 초기 상태
      const init: VipPayload = { type: 'vip', vipLevel: 'FREE' };
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(init)}\n\n`)
      );

      // heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`)
        );
      }, 10_000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        remove();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
