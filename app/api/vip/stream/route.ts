export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'

import { addVipClient } from '@/lib/vip/vipSSEHub'

import { verifySession } from '@/lib/auth/session'

/* =========================
 * VIP LEVEL TYPE
 * ========================= */
type UserVIPLevel = 'FREE' | 'VIP'

/* =========================
 * VIP SSE Payload
 * ========================= */
export type VipSSEPayload =
  | {
      type: 'VIP_LEVEL'
      vipLevel: UserVIPLevel
    }
  | {
      type: 'RISK_UPDATE'
      riskLevel:
        | 'LOW'
        | 'MEDIUM'
        | 'HIGH'
        | 'EXTREME'
      judgement: string
      isExtreme: boolean
      ts: number
    }
  | {
      type: 'HEARTBEAT'
      ts: number
    }

const encoder = new TextEncoder()

export async function GET(
  req: NextRequest,
) {
  /* =========================
   * Session Auth
   * ========================= */
  const user =
    await verifySession()

  /**
   * FREE / VIP 구조 적용
   */
  const vipLevel: UserVIPLevel =
    user?.vipLevel === 'VIP'
      ? 'VIP'
      : 'FREE'

  /**
   * VIP 전용 SSE 접근 제한
   */
  if (!user || vipLevel !== 'VIP') {
    return new Response(
      'Unauthorized',
      {
        status: 401,
      },
    )
  }

  const userId = user.id

  const stream =
    new ReadableStream<Uint8Array>({
      start(controller) {
        let closed = false

        /* =========================
         * SSE Connected
         * ========================= */
        controller.enqueue(
          encoder.encode(
            `: vip sse connected\n\n`,
          ),
        )

        /* =========================
         * VIP SSE Hub 등록
         * ========================= */
        const removeClient =
          addVipClient(
            userId,
            controller,
          )

        /* =========================
         * 초기 VIP 상태
         * ========================= */
        const initPayload: VipSSEPayload =
          {
            type: 'VIP_LEVEL',
            vipLevel,
          }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify(initPayload)}\n\n`,
          ),
        )

        /* =========================
         * Heartbeat
         * ========================= */
        const heartbeat =
          setInterval(() => {
            if (closed) return

            try {
              const payload: VipSSEPayload =
                {
                  type: 'HEARTBEAT',
                  ts: Date.now(),
                }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify(payload)}\n\n`,
                ),
              )
            } catch {
              closed = true
            }
          }, 10_000)

        /* =========================
         * Cleanup
         * ========================= */
        req.signal.addEventListener(
          'abort',
          () => {
            if (closed) return

            closed = true

            clearInterval(
              heartbeat,
            )

            removeClient()

            try {
              controller.close()
            } catch {}
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

      'X-Accel-Buffering':
        'no',
    },
  })
}
