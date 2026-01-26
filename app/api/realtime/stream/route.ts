import { NextRequest } from 'next/server'
import { addSSEClient } from '@/lib/realtime/sseHub'

// =========================
// 🔥 Server Boot (Singleton)
// =========================
const g = globalThis as typeof globalThis & {
  __MARKET_BOOTSTRAPPED__?: boolean
}

if (!g.__MARKET_BOOTSTRAPPED__) {
  g.__MARKET_BOOTSTRAPPED__ = true

  // 🔥 Redis Consumer
  import('@/lib/market/marketRealtimeConsumer')

  // 🔥 Binance Price Stream (SSOT)
  import('@/lib/market/binanceStream')

  console.log('[SERVER] market streams bootstrapped')
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()

      /**
       * 1️⃣ 즉시 연결 ACK
       */
      controller.enqueue(
        encoder.encode(`: connected\n\n`)
      )

      /**
       * 2️⃣ SSE Hub 등록
       * REALTIME (PRICE / OI / VOLUME / WHALE)
       */
      const cleanup = addSSEClient(controller, {
        scope: 'REALTIME',
      })

      /**
       * 3️⃣ 연결 종료 처리
       */
      const onAbort = () => {
        cleanup()
        try {
          controller.close()
        } catch {
          // ignore
        }
      }

      req.signal.addEventListener('abort', onAbort, {
        once: true,
      })
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
