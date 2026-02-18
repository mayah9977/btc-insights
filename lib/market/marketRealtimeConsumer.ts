import { createRedisSubscriber } from '@/lib/redis'
import { redis } from '@/lib/redis/server'
import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'

import { updateOI } from '@/lib/market/pricePolling'
import {
  loadAllWhaleIntensityKeys,
  loadWhaleIntensityHistory,
} from '@/lib/market/whaleRedisStore'

import {
  setLastOI,
  setLastVolume,
  setLastFundingRate,
  pushRecentPrice,
  getLastActionGateInput,
  setLastActionGateInput,
  setActionGateState,
  setLastBollingerSignal,
} from '@/lib/market/marketLastStateStore'

import { pushRollingValue } from '@/lib/market/statsRolling'
import { CandleAggregator30m } from '@/lib/market/candleAggregator30m'
import type { ConfirmedBBSignal } from '@/lib/market/candleAggregator30m'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

import { buildRiskInputFromRealtime } from '@/lib/market/buildRiskInputFromRealtime'
import { getActionGateState } from '@/lib/market/action/getActionGateState'
import type { ActionGateInput } from '@/lib/market/actionGate/actionGateInput'

import { computeSentiment } from '@/lib/market/sentimentEngine'

const STRUCTURAL_KEY = 'market:finalized:analysis'

const g = globalThis as any

if (!g.__MARKET_CONSUMER_STARTED__) {
  g.__MARKET_CONSUMER_STARTED__ = true

  console.log('[MARKET CONSUMER] started (guarded)')

  ;(async () => {
    try {
      const symbols = await loadAllWhaleIntensityKeys()
      for (const symbol of symbols) {
        await loadWhaleIntensityHistory(symbol)
      }
    } catch (e) {
      console.error('[MARKET CONSUMER] whaleIntensity hydrate failed', e)
    }
  })()

  const candle30mMap: Record<string, CandleAggregator30m> = {}

  const sub = createRedisSubscriber()
  const pub = createRedisSubscriber()

  sub.subscribe('realtime:market')

  const whaleAvgWindowMap: Record<
    string,
    { buf: number[]; sum: number; max: number }
  > = {}

  function pushAvg(symbol: string, v: number, windowSize = 30) {
    const st =
      whaleAvgWindowMap[symbol] ??
      (whaleAvgWindowMap[symbol] = { buf: [], sum: 0, max: windowSize })

    st.max = windowSize
    st.buf.push(v)
    st.sum += v

    while (st.buf.length > st.max) {
      const out = st.buf.shift()
      if (typeof out === 'number') st.sum -= out
    }

    return st.buf.length > 0 ? st.sum / st.buf.length : 0
  }

  function calcTrend(curr: number, avg: number): 'UP' | 'DOWN' | 'FLAT' {
    const diff = curr - avg
    const eps = 0.02
    if (diff > eps) return 'UP'
    if (diff < -eps) return 'DOWN'
    return 'FLAT'
  }

  sub.on('message', async (_channel, raw) => {
    try {
      const event = JSON.parse(raw)

      /* ================= OI ================= */
      if (event.type === 'OI_TICK') {
        updateOI(event.symbol, event.openInterest)
        setLastOI(event.symbol, event.openInterest)

        pushRollingValue(`OI_${event.symbol}`, event.openInterest, 50)
      }

      /* ================= VOLUME ================= */
      if (event.type === 'VOLUME_TICK') {
        setLastVolume(event.symbol, event.volume)
      }

      /* ================= FUNDING ================= */
      if (event.type === 'FUNDING_RATE_TICK') {
        setLastFundingRate(event.symbol, event.fundingRate)
      }

      /* ================= PRICE ================= */
      if (event.type === 'PRICE_TICK') {
        const symbol = event.symbol
        const price = event.price
        const ts = event.ts

        if (!Number.isFinite(ts)) return

        pushRecentPrice(symbol, price)

        candle30mMap[symbol] ??= new CandleAggregator30m(symbol)
        const aggregator = candle30mMap[symbol]

        const result = aggregator.update({ price, ts }, 0)
        const confirmedSignal =
          result.confirmedSignal as ConfirmedBBSignal | undefined

        const liveCommentary = result.liveCommentary

        if (liveCommentary) {
          pub.publish('realtime:market', JSON.stringify(liveCommentary))
        }

        if (confirmedSignal) {
          /* 🔥 1️⃣ 기존 상태 저장 */
          setLastBollingerSignal(symbol, {
            enabled: true,
            timeframe: '30m',
            symbol,
            signalType:
              confirmedSignal.signalType as BollingerSignalType,
            candle: confirmedSignal.candle,
            bands: confirmedSignal.bands,
            confirmed: true,
            at: confirmedSignal.at,
          })

          pub.publish(
            'realtime:market',
            JSON.stringify(confirmedSignal),
          )

          /* 🔥 2️⃣ Finalized Redis 저장 (핵심 추가) */
          const sentence =
            BOLLINGER_SENTENCE_MAP[
              confirmedSignal.signalType as BollingerSignalType
            ]

          if (sentence?.description) {
            await redis.set(
              STRUCTURAL_KEY,
              sentence.description,
            )
          }
        }
      }

      /* ================= RISK + SENTIMENT ================= */
      if (
        event.type === 'PRICE_TICK' ||
        event.type === 'OI_TICK' ||
        event.type === 'FUNDING_RATE_TICK'
      ) {
        const symbol = event.symbol
        const snapshot = await buildRiskInputFromRealtime(symbol)
        if (!snapshot) return

        const intensity = Number.isFinite(snapshot.whaleIntensity)
          ? snapshot.whaleIntensity
          : 0

        const avg = pushAvg(symbol, intensity, 30)
        const trend = calcTrend(intensity, avg)

        const isSpike =
          intensity >= 0.7 ||
          (avg > 0 && intensity >= avg * 1.6)

        pub.publish(
          'realtime:market',
          JSON.stringify({
            type: 'WHALE_INTENSITY',
            symbol,
            intensity,
            avg,
            trend,
            isSpike,
            ts: Date.now(),
          }),
        )

        try {
          const sentiment = computeSentiment(snapshot)

          pub.publish(
            'realtime:market',
            JSON.stringify({
              type: 'SENTIMENT_UPDATE',
              symbol,
              sentiment,
              ts: Date.now(),
            }),
          )
        } catch (err) {
          console.error('[Sentiment error]', err)
        }

        const nextActionGateInput: ActionGateInput = {
          whalePressure: snapshot.whalePressure,
          participationState: snapshot.participationState,
          bollingerRegime: snapshot.bollingerRegime,
          elliott: snapshot.elliott,
          trend: snapshot.trend,
          fibonacci: snapshot.fibonacci,
          momentum: snapshot.momentum,
        }

        const prev = getLastActionGateInput(symbol)

        if (JSON.stringify(prev) !== JSON.stringify(nextActionGateInput)) {
          setActionGateState(
            symbol,
            getActionGateState(nextActionGateInput),
          )

          setLastActionGateInput(symbol, nextActionGateInput)
        }
      }
    } catch (e) {
      console.error('[MARKET CONSUMER] parse error', e)
    }
  })
}
