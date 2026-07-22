// app/api/realtime/stream/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'
import { addSSEClient, SSEScope } from '@/lib/realtime/sseHub'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getUserVIPLevel } from '@/lib/vip/vipServer'

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

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 600

export async function GET(req: NextRequest) {
  const scopeParam = req.nextUrl.searchParams.get('scope')

  const scope: SSEScope =
    scopeParam === 'vip' ? 'VIP' : 'REALTIME'

  if (scope === 'VIP') {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        {
          ok: false,
          error: 'UNAUTHORIZED',
        },
        { status: 401 },
      )
    }

    const vipLevel =
      await getUserVIPLevel(currentUser.id)

    if (vipLevel !== 'VIP') {
      return NextResponse.json(
        {
          ok: false,
          error: 'VIP_REQUIRED',
        },
        { status: 403 },
      )
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()

      let closed = false

      const replayTimeouts: NodeJS.Timeout[] = []

      function safeEnqueue(payload: string) {
        if (closed) {
          return
        }

        try {
          controller.enqueue(
            encoder.encode(payload),
          )
        } catch (error) {
          closed = true

          console.error(
            '[SSE] enqueue failed',
            error,
          )
        }
      }

      function send(event: any) {
        if (closed) {
          return
        }

        if (scope === 'VIP') {
          const VIP_EVENTS = new Set([
            'PRICE_TICK',
            'OI_TICK',
            'VOLUME_TICK',
            'FUNDING_RATE_TICK',

            'FMAI',
            'WHALE_INTENSITY',
            'WHALE_NET_PRESSURE',
            'WHALE_TRADE_FLOW',
            'WHALE_ABSORPTION',
            'LIQUIDITY_SWEEP',
            'MARKET_REGIME',
            'FINAL_DECISION',

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

      safeEnqueue(`retry: 1000\n: connected\n\n`)

      const cleanup = addSSEClient(controller, {
        scope,
      })

      const heartbeat = setInterval(() => {
        if (closed) {
          return
        }

        safeEnqueue(
          `event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`,
        )
      }, 15000)

      const symbol = 'BTCUSDT'

      function scheduleReplay(
        callback: () => void,
        delay: number,
      ) {
        const timeout = setTimeout(() => {
          if (closed) {
            return
          }

          callback()
        }, delay)

        replayTimeouts.push(timeout)
      }

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

      const onAbort = () => {
        if (closed) {
          return
        }

        closed = true

        clearInterval(heartbeat)

        for (const timeout of replayTimeouts) {
          clearTimeout(timeout)
        }

        cleanup()

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
