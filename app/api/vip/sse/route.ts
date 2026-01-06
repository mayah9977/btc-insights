export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { addVipClient } from '@/lib/vip/vipSSEHub'

type VipPayload =
  | { type: 'vip'; vipLevel: string }
  | { type: 'heartbeat' }

const encoder = new TextEncoder()

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) {
    return new Response('Missing userId', { status: 400 })
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false

      const removeClient = addVipClient(userId, controller)

      /* ✅ comment ping (SSE 안정성) */
      controller.enqueue(encoder.encode(`: vip sse connected\n\n`))

      /* 초기 상태 */
      const init: VipPayload = {
        type: 'vip',
        vipLevel: 'FREE',
      }

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(init)}\n\n`)
      )

      /* heartbeat */
      const heartbeat = setInterval(() => {
        if (closed) return
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`
            )
          )
        } catch {
          closed = true
        }
      }, 10_000)

      /* cleanup */
      req.signal.addEventListener(
        'abort',
        () => {
          if (closed) return
          closed = true

          clearInterval(heartbeat)
          removeClient()

          try {
            controller.close()
          } catch {}
        },
        { once: true }
      )
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
