export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { addVipClient } from '@/lib/vip/vipSSEHub'
import { verifySession } from '@/lib/auth/session'

/* =========================
 * VIP SSE Payload
 * ========================= */
export type VipSSEPayload =
  | {
      type: 'VIP_LEVEL'
      vipLevel: number
    }
  | {
      type: 'RISK_UPDATE'
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
      judgement: string
      isExtreme: boolean
      ts: number
    }
  | {
      type: 'HEARTBEAT'
      ts: number
    }

const encoder = new TextEncoder()

export async function GET(req: NextRequest) {
  /* =========================
   * ✅ Session / VIP Auth
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
       * SSE 연결 안정화 (comment)
       * ========================= */
      controller.enqueue(
        encoder.encode(`: vip sse connected\n\n`)
      )

      /* =========================
       * VIP SSE Hub 등록
       * ========================= */
      const removeClient = addVipClient(userId, controller)

      /* =========================
       * 초기 VIP 상태
       * ========================= */
      const initPayload: VipSSEPayload = {
        type: 'VIP_LEVEL',
        vipLevel: user.vipLevel,
      }

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify(initPayload)}\n\n`
        )
      )

      /* =========================
       * 💓 Heartbeat
       * ========================= */
      const heartbeat = setInterval(() => {
        if (closed) return
        try {
          const payload: VipSSEPayload = {
            type: 'HEARTBEAT',
            ts: Date.now(),
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify(payload)}\n\n`
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
