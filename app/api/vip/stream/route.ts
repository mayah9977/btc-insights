// app/api/vip/stream/route.ts
import { getUserVIPLevel } from '@/lib/vip/vipServer';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // TODO: session에서 userId 추출
      const userId = 'dev-user';

      let lastLevel = await getUserVIPLevel(userId);

      setInterval(async () => {
        const current = await getUserVIPLevel(userId);
        if (current !== lastLevel) {
          controller.enqueue(
            encoder.encode(`data: ${current}\n\n`)
          );
          lastLevel = current;
        }
      }, 3000);
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
