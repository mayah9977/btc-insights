// app/api/alerts/sse/route.ts

// 🔥 Binance WebSocket 강제 실행 (사이드 이펙트 import)
import '@/lib/market/binanceStream'

import { NextRequest } from 'next/server'
import { redis } from '@/lib/redis'
import { resolveNotificationPrincipal } from '@/lib/auth/notificationPrincipal'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { isVIP } from '@/lib/vip/vipServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 600

export async function GET(req: NextRequest) {
  const principal =
    await resolveNotificationPrincipal()

  const currentUser =
    await getCurrentUser()

  const vipActive =
    currentUser &&
    currentUser.id === principal.userId
      ? await isVIP(currentUser.id)
      : false

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()

      // ✅ SSE keep-alive / initial frame
      controller.enqueue(
        encoder.encode(`retry: 1000\n: connected\n\n`),
      )

      const subscriber =
        typeof (redis as any).duplicate ===
        'function'
          ? (redis as any).duplicate()
          : redis

      let closed = false
      let messageListenerAttached = false

      const send = (event: any) => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify(
                event,
              )}\n\n`,
            ),
          )
        } catch {}
      }

      const handleMessage = (
        message: string,
      ) => {
        try {
          const parsed = JSON.parse(message)

          if (
            parsed?.type ===
            'ALERT_TRIGGERED'
          ) {
            if (
              parsed?.userId !==
              principal.userId
            ) {
              return
            }

            send(parsed)
            return
          }

          if (
            parsed?.type ===
              'INDICATOR_SIGNAL' ||
            parsed?.type ===
              'INSTITUTIONAL_PATTERN_SIGNAL'
          ) {
            if (!vipActive) {
              return
            }

            send(parsed)
          }
        } catch (error) {
          console.error(
            '[ALERTS SSE][PARSE ERROR]',
            error,
          )
        }
      }

      const onMessage = (
        channel: string,
        message: string,
      ) => {
        if (
          channel !==
          'realtime:alerts'
        ) {
          return
        }

        handleMessage(message)
      }

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`,
            ),
          )
        } catch {}
      }, 15000)

      const bootSubscriber = async () => {
        try {
          if (
            typeof (subscriber as any)
              .connect === 'function'
          ) {
            try {
              await (subscriber as any).connect()
            } catch {}
          }

          if (closed) {
            return
          }

          if (
            typeof (subscriber as any).on ===
            'function'
          ) {
            ;(subscriber as any).on(
              'message',
              onMessage,
            )

            messageListenerAttached = true
          }

          if (closed) {
            if (
              messageListenerAttached &&
              typeof (subscriber as any).off ===
                'function'
            ) {
              ;(subscriber as any).off(
                'message',
                onMessage,
              )

              messageListenerAttached = false
            } else if (
              messageListenerAttached &&
              typeof (subscriber as any)
                .removeListener === 'function'
            ) {
              ;(subscriber as any).removeListener(
                'message',
                onMessage,
              )

              messageListenerAttached = false
            }

            return
          }

          if (
            typeof (
              subscriber as any
            ).subscribe === 'function'
          ) {
            await (
              subscriber as any
            ).subscribe('realtime:alerts')
          }
        } catch (error) {
          console.error(
            '[ALERTS SSE][SUBSCRIBE ERROR]',
            error,
          )
        }
      }

      void bootSubscriber()

      const onAbort = async () => {
        closed = true

        clearInterval(heartbeat)

        try {
          if (
            messageListenerAttached &&
            typeof (subscriber as any).off ===
              'function'
          ) {
            ;(subscriber as any).off(
              'message',
              onMessage,
            )

            messageListenerAttached = false
          } else if (
            messageListenerAttached &&
            typeof (subscriber as any)
              .removeListener === 'function'
          ) {
            ;(subscriber as any).removeListener(
              'message',
              onMessage,
            )

            messageListenerAttached = false
          }
        } catch {}

        try {
          if (
            typeof (
              subscriber as any
            ).unsubscribe === 'function'
          ) {
            await (
              subscriber as any
            ).unsubscribe(
              'realtime:alerts',
            )
          }
        } catch {}

        try {
          if (
            typeof (subscriber as any)
              .quit === 'function'
          ) {
            await (subscriber as any).quit()
          }
        } catch {}

        try {
          if (
            typeof (
              subscriber as any
            ).disconnect === 'function'
          ) {
            await (
              subscriber as any
            ).disconnect()
          }
        } catch {}

        try {
          controller.close()
        } catch {}
      }

      req.signal.addEventListener(
        'abort',
        () => {
          void onAbort()
        },
        { once: true },
      )
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':
        'text/event-stream; charset=utf-8',
      'Cache-Control':
        'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
