export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { addVipClient } from '@/lib/vip/vipSSEHub'
import { verifySession } from '@/lib/auth/session'

/* =========================
 * Types
 * ========================= */
type VipPayload =
  | { type: 'vip'; vipLevel: number }
  | { type: 'heartbeat' }

const encoder = new TextEncoder()

export async function GET(req: NextRequest) {
  /* =========================
   * ✅ VIP 인증 (필수)
   * ========================= */
  const user = await verifySession()

  // VIP3 이상만 허용
  if (!user || user.vipLevel < 3) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = user.id

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false

      /* =========================
       * ✅ 초기 comment ping (SSE 안정화)
       * ========================= */
      controller.enqueue(
        encoder.encode(`: vip sse connected\n\n`)
      )

      /* =========================
       * ✅ VIP client 등록
       * ========================= */
      const remove = addVipClient(userId, controller)

      /* =========================
       * ✅ 초기 상태 payload
       * ========================= */
      const init: VipPayload = {
        type: 'vip',
        vipLevel: user.vipLevel,
      }

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(init)}\n\n`)
      )

      /* =========================
       * 💓 Heartbeat
       * ========================= */
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

      /* =========================
       * 🔚 Cleanup
       * ========================= */
      req.signal.addEventListener(
        'abort',
        () => {
          if (closed) return
          closed = true

          clearInterval(heartbeat)
          remove()

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
