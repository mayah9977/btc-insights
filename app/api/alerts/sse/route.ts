// 🔥 Binance WebSocket 강제 실행 (사이드 이펙트 import)
import '@/lib/market/binanceStream'

import { NextRequest } from 'next/server'
import { addSSEClient } from '@/lib/realtime/sseHub'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()

      // ✅ SSE keep-alive / initial frame
      controller.enqueue(encoder.encode(`: connected\n\n`))

      /**
       * 🔥 ALERTS 전용 SSE 등록
       * - ALERT_TRIGGERED 이벤트를 수신하기 위한 scope
       */
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
