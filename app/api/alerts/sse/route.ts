// 🔥 Binance WebSocket 강제 실행 (사이드 이펙트 import)
import '@/lib/market/binanceStream'

import { NextRequest } from 'next/server'
import { addSSEClient } from '@/lib/realtime/sseHub'
import { redis } from '@/lib/redis'

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

      const subscriber =
        typeof (redis as any).duplicate === 'function'
          ? (redis as any).duplicate()
          : redis

      const send = (event: any) => {
        try {
          console.log('[ALERTS SSE][SEND]', event)

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          )
        } catch {}
      }

      const handleMessage = (message: string) => {
        try {
          console.log('[ALERTS SSE][REDIS RAW]', message)

          const parsed = JSON.parse(message)

          if (
            parsed?.type !== 'ALERT_TRIGGERED' &&
            parsed?.type !== 'INDICATOR_SIGNAL'
          ) {
            return
          }

          console.log('[ALERTS SSE][REDIS PARSED]', parsed)
          send(parsed)
        } catch (error) {
          console.error('[ALERTS SSE][PARSE ERROR]', error)
        }
      }

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`event: ping\ndata: {}\n\n`),
          )
        } catch {}
      }, 15000)

      const bootSubscriber = async () => {
        try {
          if (typeof (subscriber as any).connect === 'function') {
            try {
              await (subscriber as any).connect()
            } catch {}
          }

          if (typeof (subscriber as any).on === 'function') {
            ;(subscriber as any).on(
              'message',
              (channel: string, message: string) => {
                if (channel !== 'realtime:alerts') return
                handleMessage(message)
              },
            )
          }

          if (typeof (subscriber as any).subscribe === 'function') {
            await (subscriber as any).subscribe('realtime:alerts')
            console.log(
              '[ALERTS SSE] subscribed: realtime:alerts',
            )
          }
        } catch (error) {
          console.error('[ALERTS SSE][SUBSCRIBE ERROR]', error)
        }
      }

      void bootSubscriber()

      const onAbort = async () => {
        clearInterval(heartbeat)

        cleanup()

        try {
          if (typeof (subscriber as any).unsubscribe === 'function') {
            await (subscriber as any).unsubscribe(
              'realtime:alerts',
            )
          }
        } catch {}

        try {
          if (typeof (subscriber as any).quit === 'function') {
            await (subscriber as any).quit()
          }
        } catch {}

        try {
          if (typeof (subscriber as any).disconnect === 'function') {
            await (subscriber as any).disconnect()
          }
        } catch {}

        try {
          controller.close()
        } catch {}
      }

      req.signal.addEventListener('abort', () => {
        void onAbort()
      }, { once: true })
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
