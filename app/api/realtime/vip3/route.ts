
import { NextRequest } from 'next/server';
import { getUserVIPLevel } from '@/lib/vip/vipServer';
import { VIP_USAGE_POLICY } from '@/lib/vip/vipUsagePolicy';

export const dynamic = 'force-dynamic';

const sseConnections = new Map<string, number>();

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const vip = await getUserVIPLevel(userId);
  if (vip !== 'VIP3') return new Response('Forbidden', { status: 403 });

  const policy = VIP_USAGE_POLICY[vip];
  const current = sseConnections.get(userId) ?? 0;

  if (current >= policy.sseConnections) {
    return new Response('Too many connections', { status: 429 });
  }

  sseConnections.set(userId, current + 1);

  let timer: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: any) => {
        controller.enqueue(`data: ${JSON.stringify(payload)}\n\n`);
      };

      send({ type: 'INIT', vip });

      timer = setInterval(() => {
        send({
          type: 'VIP3_STREAM',
          signal: 'EXTREME_WHALE_ACTIVITY',
          score: Math.random().toFixed(3),
          at: Date.now(),
        });
      }, 2000);
    },
    cancel() {
      clearInterval(timer);
      const left = (sseConnections.get(userId) ?? 1) - 1;
      if (left <= 0) sseConnections.delete(userId);
      else sseConnections.set(userId, left);
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
