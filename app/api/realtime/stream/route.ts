import { NextRequest } from 'next/server'
import { addSSEClient } from '@/lib/realtime/sseHub'

// 🔥 VIP Risk SSOT
import { getLastVipRisk } from '@/lib/vip/vipLastRiskStore'

// 🔥 Market SSOT
import {
  getLastOI,
  getLastVolume,
  getLastFundingRate,
} from '@/lib/market/marketLastStateStore'

// 🔥 Sentiment SSOT (추가)
import { getLastSentiment } from '@/lib/sentiment/sentimentLastStateStore'

// =========================
// 🔥 Server Boot (Singleton)
// =========================
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
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()

      function send(event: any) {
        console.log('[SSE_STREAM_SEND]', {
          type: event?.type,
          symbol: event?.symbol,
        })

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
      const cleanup = addSSEClient(controller, {
        scope: 'REALTIME',
      })

      /* =========================
       * 3️⃣ VIP Risk Replay
       * ========================= */
      const lastRisk = getLastVipRisk()
      if (lastRisk) {
        send({
          type: 'RISK_UPDATE',
          ...lastRisk,
        })
      }

      /* =========================
       * 4️⃣ Market OI Replay
       * ========================= */
      const oi = getLastOI('BTCUSDT')
      if (oi !== undefined) {
        send({
          type: 'OI_TICK',
          symbol: 'BTCUSDT',
          openInterest: oi,
        })
      }

      /* =========================
       * 5️⃣ Market Volume Replay
       * ========================= */
      const volume = getLastVolume('BTCUSDT')
      if (volume !== undefined) {
        send({
          type: 'VOLUME_TICK',
          symbol: 'BTCUSDT',
          volume,
        })
      }

      /* =========================
       * 6️⃣ Market Funding Rate Replay
       * ========================= */
      const fundingRate = getLastFundingRate('BTCUSDT')
      if (fundingRate != null) {
        send({
          type: 'FUNDING_RATE_TICK',
          symbol: 'BTCUSDT',
          fundingRate,
        })
      }

      /* =========================
       * 🔥 7️⃣ Sentiment Replay (추가된 부분)
       * ========================= */
      const lastSentiment = getLastSentiment()
      if (lastSentiment != null) {
        send({
          type: 'SENTIMENT_UPDATE',
          symbol: 'BTCUSDT',
          sentiment: lastSentiment,
          ts: Date.now(),
        })
      }

      /* =========================
       * 8️⃣ 연결 종료 처리
       * ========================= */
      const onAbort = () => {
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
      'X-Accel-Buffering': 'no',
    },
  })
}
