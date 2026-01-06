import { NextRequest } from 'next/server'
import { addSSEClient } from '@/lib/realtime/sseHub'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()

      // comment frame (SSE 안정화)
      controller.enqueue(encoder.encode(`: connected\n\n`))

      // 🔥 ALERTS scope로 등록
      const cleanup = addSSEClient(controller, {
        scope: 'ALERTS',
      })

      const onAbort = () => {
        cleanup()
        try {
          controller.close()
        } catch {}
      }

      req.signal.addEventListener('abort', onAbort, { once: true })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
