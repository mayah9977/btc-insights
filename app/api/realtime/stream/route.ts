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

      function send(event: any) {
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
       * 2️⃣ SSE Hub 등록 (scope 적용)
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

      /* =========================
       * 4️⃣ VIP Risk Replay
       * ========================= */
      if (scope === 'VIP') {
        const lastRisk = getLastVipRisk()
        if (lastRisk) {
          send({
            type: 'RISK_UPDATE',
            ...lastRisk,
          })
        }
      }

      /* =========================
       * 5️⃣ OI Replay (🔥 Drift 포함)
       * ========================= */
      const symbol = 'BTCUSDT'
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

        send({
          type: 'OI_TICK',
          symbol,
          openInterest: oi,
          delta,
          direction,
          ts: Date.now(),
        })
      }

      /* =========================
       * 6️⃣ Volume Replay
       * ========================= */
      const volume = getLastVolume(symbol)
      if (volume !== undefined) {
        send({
          type: 'VOLUME_TICK',
          symbol,
          volume,
          ts: Date.now(),
        })
      }

      /* =========================
       * 7️⃣ Funding Replay
       * ========================= */
      const fundingRate = getLastFundingRate(symbol)
      if (fundingRate != null) {
        send({
          type: 'FUNDING_RATE_TICK',
          symbol,
          fundingRate,
          ts: Date.now(),
        })
      }

      /* =========================
       * 8️⃣ Sentiment Replay
       * ========================= */
      const lastSentiment = getLastSentiment()
      if (lastSentiment != null) {
        send({
          type: 'SENTIMENT_UPDATE',
          symbol,
          sentiment: lastSentiment,
          ts: Date.now(),
        })
      }

      /* =========================
       * 9️⃣ 연결 종료 처리
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
