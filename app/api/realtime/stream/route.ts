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

      /* =========================
      * 🔥 VIP EVENT FILTER
      * ========================= */

      function send(event: any) {

        if (scope === 'VIP') {

          const VIP_EVENTS = new Set([

            'FMAI',
            'WHALE_INTENSITY',
            'WHALE_NET_PRESSURE',
            'WHALE_ABSORPTION',
            'LIQUIDITY_SWEEP',
            'MARKET_REGIME',
            'FINAL_DECISION',

            /* 🔥 추가 (Bollinger) */
            'BB_SIGNAL',
            'BB_LIVE_COMMENTARY'

          ])

          if (!VIP_EVENTS.has(event.type)) {
            return
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        )
      }

      /* =========================
      * 1️⃣ 연결 ACK
      * ========================= */

      controller.enqueue(
        encoder.encode(`: connected\n\n`)
      )

      /* =========================
      * 2️⃣ SSE Hub 등록
      * ========================= */

      const cleanup = addSSEClient(controller, { scope })

      /* =========================
      * 3️⃣ Heartbeat
      * ========================= */

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`event: ping\ndata: {}\n\n`)
          )
        } catch {}
      }, 15000)

      const symbol = 'BTCUSDT'

      /* =========================
      * 4️⃣ VIP Risk Replay
      * ========================= */

      if (scope === 'VIP') {

        const lastRisk = getLastVipRisk()

        if (lastRisk) {
          setTimeout(() => {
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

        setTimeout(() => {
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
        setTimeout(() => {
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

      const fundingRate = getLastFundingRate(symbol)

      if (fundingRate != null) {
        setTimeout(() => {
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

        const lastDecision = getLastFinalDecision(symbol)

        if (lastDecision) {
          setTimeout(() => {
            send({
              type: 'FINAL_DECISION',
              symbol,
              decision: lastDecision.decision,
              dominant: lastDecision.dominant,
              confidence: lastDecision.confidence,
              ts: Date.now(),
            })
          }, 200)
        }
      }

      /* =========================
      * 9️⃣ Sentiment Replay
      * ========================= */

      const lastSentiment = getLastSentiment()

      if (lastSentiment != null) {
        setTimeout(() => {
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

        clearInterval(heartbeat)

        cleanup()

        try {
          controller.close()
        } catch {}
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
      'Transfer-Encoding': 'chunked',
      'X-Accel-Buffering': 'no',
    },
  })
}
