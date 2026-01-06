import { NextRequest } from 'next/server'
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import { VIP_USAGE_POLICY } from '@/lib/vip/vipUsagePolicy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const encoder = new TextEncoder()
const sseConnections = new Map<string, number>()

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const vip = await getUserVIPLevel(userId)
  if (vip !== 'VIP3') {
    return new Response('Forbidden', { status: 403 })
  }

  const policy = VIP_USAGE_POLICY[vip]
  const current = sseConnections.get(userId) ?? 0

  if (current >= policy.sseConnections) {
    return new Response('Too many connections', { status: 429 })
  }

  sseConnections.set(userId, current + 1)

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false

      const send = (payload: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        )
      }

      /* ✅ comment ping (중요) */
      controller.enqueue(encoder.encode(`: vip3 connected\n\n`))

      /* INIT */
      send({ type: 'INIT', vip })

      const timer = setInterval(() => {
        if (closed) return
        try {
          send({
            type: 'VIP3_STREAM',
            signal: 'EXTREME_WHALE_ACTIVITY',
            score: Number(Math.random().toFixed(3)),
            at: Date.now(),
          })
        } catch {
          closed = true
        }
      }, 2000)

      /* ✅ Abort cleanup */
      req.signal.addEventListener(
        'abort',
        () => {
          if (closed) return
          closed = true

          clearInterval(timer)

          const left = (sseConnections.get(userId) ?? 1) - 1
          if (left <= 0) sseConnections.delete(userId)
          else sseConnections.set(userId, left)

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
