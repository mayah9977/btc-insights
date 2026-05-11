// app/api/realtime/stream/route.ts

import { NextRequest } from 'next/server'
import { addSSEClient, SSEScope } from '@/lib/realtime/sseHub'

// 🔥 VIP Risk SSOT
import { getLastVipRisk } from '@/lib/vip/vipLastRiskStore'

// 🔥 Market SSOT
import {
  getLastOI,
  getPrevOI,
  getLastVolume,
  getLastFundingRate,
  getLastFinalDecision,
} from '@/lib/market/marketLastStateStore'

// 🔥 Sentiment SSOT
import { getLastSentiment } from '@/lib/sentiment/sentimentLastStateStore'

/* =========================
 * 🔥 Server Boot (Singleton)
 * ========================= */

const g = globalThis as typeof globalThis & {
  __MARKET_BOOTSTRAPPED__?: boolean
}

if (!g.__MARKET_BOOTSTRAPPED__) {
  g.__MARKET_BOOTSTRAPPED__ = true

  import('@/lib/market/marketRealtimeConsumer')
  import('@/lib/market/binanceStream')

  console.log('[SERVER] market streams bootstrapped')
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const scopeParam = req.nextUrl.searchParams.get('scope')

  const scope: SSEScope =
    scopeParam === 'vip' ? 'VIP' : 'REALTIME'

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()

      /**
       * 🔥 안정화 핵심:
       * controller.close() 이후 enqueue 방지용 상태값.
       *
       * 기존 구조를 유지하면서:
       * - abort 이후 enqueue 방지
       * - timeout replay 방지
       * - heartbeat enqueue 방지
       *
       * 최소 수정 원칙으로 적용.
       */
      let closed = false

      /**
       * 🔥 replay timeout cleanup
       *
       * 기존 setTimeout replay 구조는 유지하고,
       * 연결 종료 시 clearTimeout만 수행.
       */
      const replayTimeouts: NodeJS.Timeout[] = []

      /* =========================
       * 🔥 Safe enqueue
       * ========================= */

      function safeEnqueue(payload: string) {
        /**
         * 🔥 이미 종료된 stream이면 enqueue 금지
         */
        if (closed) {
          return
        }

        try {
          controller.enqueue(
            encoder.encode(payload),
          )
        } catch (error) {
          /**
           * 🔥 enqueue 실패 시 stream 종료 상태로 전환
           *
           * 이유:
           * controller.close() 이후 enqueue 시
           * ERR_INVALID_STATE 발생 가능.
           */
          closed = true

          console.error(
            '[SSE] enqueue failed',
            error,
          )
        }
      }

      /* =========================
       * 🔥 VIP EVENT FILTER
       * ========================= */

      function send(event: any) {
        /**
         * 🔥 stream 종료 후 enqueue 방지
         */
        if (closed) {
          return
        }

        if (scope === 'VIP') {
          const VIP_EVENTS = new Set([
            'FMAI',
            'WHALE_INTENSITY',
            'WHALE_NET_PRESSURE',
            'WHALE_ABSORPTION',
            'LIQUIDITY_SWEEP',
            'MARKET_REGIME',
            'FINAL_DECISION',

            /* 🔥 Bollinger */
            'BB_SIGNAL',
            'BB_LIVE_COMMENTARY',
          ])

          if (!VIP_EVENTS.has(event.type)) {
            return
          }
        }

        safeEnqueue(
          `data: ${JSON.stringify(event)}\n\n`,
        )
      }

      /* =========================
       * 1️⃣ 연결 ACK
       * ========================= */

      safeEnqueue(`: connected\n\n`)

      /* =========================
       * 2️⃣ SSE Hub 등록
       * ========================= */

      const cleanup = addSSEClient(controller, {
        scope,
      })

      /* =========================
       * 3️⃣ Heartbeat
       * ========================= */

      const heartbeat = setInterval(() => {
        /**
         * 🔥 종료된 stream heartbeat 차단
         */
        if (closed) {
          return
        }

        safeEnqueue(
          `event: ping\ndata: {}\n\n`,
        )
      }, 15000)

      const symbol = 'BTCUSDT'

      /* =========================
       * 🔥 replay helper
       * ========================= */

      function scheduleReplay(
        callback: () => void,
        delay: number,
      ) {
        const timeout = setTimeout(() => {
          /**
           * 🔥 abort 이후 replay 실행 차단
           */
          if (closed) {
            return
          }

          callback()
        }, delay)

        replayTimeouts.push(timeout)
      }

      /* =========================
       * 4️⃣ VIP Risk Replay
       * ========================= */

      if (scope === 'VIP') {
        const lastRisk = getLastVipRisk()

        if (lastRisk) {
          scheduleReplay(() => {
            send({
              type: 'RISK_UPDATE',
              ...lastRisk,
            })
          }, 100)
        }
      }

      /* =========================
       * 5️⃣ OI Replay
       * ========================= */

      const oi = getLastOI(symbol)
      const prevOi = getPrevOI(symbol)

      if (oi !== undefined) {
        const delta =
          typeof prevOi === 'number'
            ? oi - prevOi
            : 0

        const direction =
          delta > 0
            ? 'UP'
            : delta < 0
              ? 'DOWN'
              : 'FLAT'

        scheduleReplay(() => {
          send({
            type: 'OI_TICK',
            symbol,
            openInterest: oi,
            delta,
            direction,
            ts: Date.now(),
          })
        }, 120)
      }

      /* =========================
       * 6️⃣ Volume Replay
       * ========================= */

      const volume = getLastVolume(symbol)

      if (volume !== undefined) {
        scheduleReplay(() => {
          send({
            type: 'VOLUME_TICK',
            symbol,
            volume,
            ts: Date.now(),
          })
        }, 140)
      }

      /* =========================
       * 7️⃣ Funding Replay
       * ========================= */

      const fundingRate =
        getLastFundingRate(symbol)

      if (fundingRate != null) {
        scheduleReplay(() => {
          send({
            type: 'FUNDING_RATE_TICK',
            symbol,
            fundingRate,
            ts: Date.now(),
          })
        }, 160)
      }

      /* =========================
       * 8️⃣ FINAL_DECISION Replay
       * ========================= */

      if (scope === 'VIP') {
        const lastDecision =
          getLastFinalDecision(symbol)

        if (lastDecision) {
          scheduleReplay(() => {
            send({
              type: 'FINAL_DECISION',
              symbol,
              decision:
                lastDecision.decision,
              dominant:
                lastDecision.dominant,
              confidence:
                lastDecision.confidence,
              ts: Date.now(),
            })
          }, 200)
        }
      }

      /* =========================
       * 9️⃣ Sentiment Replay
       * ========================= */

      const lastSentiment =
        getLastSentiment()

      if (lastSentiment != null) {
        scheduleReplay(() => {
          send({
            type: 'SENTIMENT_UPDATE',
            symbol,
            sentiment: lastSentiment,
            ts: Date.now(),
          })
        }, 220)
      }

      /* =========================
       * 🔟 연결 종료 처리
       * ========================= */

      const onAbort = () => {
        /**
         * 🔥 중복 abort 방지
         */
        if (closed) {
          return
        }

        closed = true

        /**
         * 🔥 heartbeat cleanup
         */
        clearInterval(heartbeat)

        /**
         * 🔥 replay timeout cleanup
         */
        for (const timeout of replayTimeouts) {
          clearTimeout(timeout)
        }

        /**
         * 🔥 SSE Hub cleanup
         */
        cleanup()

        /**
         * 🔥 controller.close() safe 처리
         */
        try {
          controller.close()
        } catch {}
      }

      req.signal.addEventListener(
        'abort',
        onAbort,
        {
          once: true,
        },
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

      'Transfer-Encoding': 'chunked',

      'X-Accel-Buffering': 'no',
    },
  })
}
