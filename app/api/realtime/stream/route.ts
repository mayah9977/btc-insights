import { NextRequest } from 'next/server'
import { addSSEClient } from '@/lib/realtime/sseHub'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()

      /**
       * 1️⃣ 즉시 연결 신호
       * - 브라우저 EventSource 안정화용
       * - 실제 데이터 아님 (comment frame)
       */
      controller.enqueue(
        encoder.encode(`: connected\n\n`)
      )

      /**
       * 2️⃣ SSE Hub에 클라이언트 등록
       * - scope: ALERTS
       * - alerts SSE 로그 / 카운트 전용
       */
      const cleanup = addSSEClient(controller, {
        scope: 'ALERTS',
      })

      /**
       * 3️⃣ 연결 종료 처리
       */
      const onAbort = () => {
        cleanup()
        try {
          controller.close()
        } catch {
          // 이미 닫힌 경우 무시
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
      // 프록시 / 엣지 버퍼링 방지
      'X-Accel-Buffering': 'no',
    },
  })
}
