import { createRedisSubscriber } from '@/lib/redis'
import { redis } from '@/lib/redis'
import { deriveOpenInterest } from './deriveOpenInterest'
import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'

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

const STRUCTURAL_KEY = 'market:finalized:analysis'
const RAW_CHANNEL = 'realtime:raw'

// 🔥 PUBLIC 채널 (VIP 분리 확장 가능)
const DERIVED_PUBLIC = 'realtime:derived:public'

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
  sub.subscribe(RAW_CHANNEL)

  const activeSymbols = new Set<string>()

  sub.on('message', async (_channel, raw) => {
    try {
      const event = JSON.parse(raw)
      if (!event?.symbol) return

      const symbol = event.symbol
      activeSymbols.add(symbol)

      /* ================= OI (🔥 Drift 적용) ================= */
      if (event.type === 'OI_TICK') {
        setLastOI(symbol, event.openInterest)
        pushRollingValue(`OI_${symbol}`, event.openInterest, 50)

        const derived = deriveOpenInterest(symbol, event.openInterest)

        await redis.publish(
          DERIVED_PUBLIC,
          JSON.stringify({
            type: 'OI_TICK',
            symbol,
            ...derived,
            ts: event.ts ?? Date.now(),
          }),
        )
      }

      /* ================= VOLUME ================= */
      if (event.type === 'VOLUME_TICK') {
        setLastVolume(symbol, event.volume)

        await redis.publish(
          DERIVED_PUBLIC,
          JSON.stringify(event),
        )
      }

      /* ================= FUNDING ================= */
      if (event.type === 'FUNDING_RATE_TICK') {
        setLastFundingRate(symbol, event.fundingRate)

        await redis.publish(
          DERIVED_PUBLIC,
          JSON.stringify(event),
        )
      }

      /* ================= WHALE TRADE FLOW ================= */
      if (event.type === 'WHALE_TRADE_FLOW') {
        await redis.publish(
          DERIVED_PUBLIC,
          JSON.stringify(event),
        )
      }

      /* ================= PRICE ================= */
      if (event.type === 'PRICE_TICK') {
        const price = event.price
        const ts = event.ts
        if (!Number.isFinite(ts)) return

        pushRecentPrice(symbol, price)

        await redis.publish(
          DERIVED_PUBLIC,
          JSON.stringify(event),
        )

        candle30mMap[symbol] ??= new CandleAggregator30m(symbol)
        const aggregator = candle30mMap[symbol]

        const result = aggregator.update({ price, ts }, 0)
        const confirmedSignal =
          result.confirmedSignal as ConfirmedBBSignal | undefined

        const liveCommentary = result.liveCommentary

        if (liveCommentary) {
          await redis.publish(
            DERIVED_PUBLIC,
            JSON.stringify(liveCommentary),
          )
        }

        if (confirmedSignal) {
          setLastBollingerSignal(symbol, {
            enabled: true,
            timeframe: '30m',
            symbol,
            signalType: confirmedSignal.signalType as BollingerSignalType,
            candle: confirmedSignal.candle,
            bands: confirmedSignal.bands,
            confirmed: true,
            at: confirmedSignal.at,
          })

          await redis.publish(
            DERIVED_PUBLIC,
            JSON.stringify(confirmedSignal),
          )

          const sentence =
            BOLLINGER_SENTENCE_MAP[
              confirmedSignal.signalType as BollingerSignalType
            ]

          if (sentence?.description) {
            await redis.set(STRUCTURAL_KEY, sentence.description)
          }
        }
      }
    } catch (e) {
      console.error('[MARKET CONSUMER] parse error', e)
    }
  })

  /* ================= WHALE INTENSITY ENGINE ================= */

  const whaleAvgWindowMap: Record<
    string,
    { buf: number[]; sum: number }
  > = {}

  function pushAvg(symbol: string, v: number, windowSize = 30) {
    const st =
      whaleAvgWindowMap[symbol] ??
      (whaleAvgWindowMap[symbol] = { buf: [], sum: 0 })

    st.buf.push(v)
    st.sum += v

    while (st.buf.length > windowSize) {
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

  setInterval(async () => {
    for (const symbol of activeSymbols) {
      try {
        const snapshot = await buildRiskInputFromRealtime(symbol)
        if (!snapshot) continue

        const intensity = Number.isFinite(snapshot.whaleIntensity)
          ? snapshot.whaleIntensity
          : 0

        const avg = pushAvg(symbol, intensity, 30)
        const trend = calcTrend(intensity, avg)

        const isSpike =
          intensity >= 0.7 || (avg > 0 && intensity >= avg * 1.6)

        await redis.publish(
          DERIVED_PUBLIC,
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
          setActionGateState(symbol, getActionGateState(nextActionGateInput))
          setLastActionGateInput(symbol, nextActionGateInput)
        }
      } catch (err) {
        console.error('[INTENSITY ENGINE ERROR]', err)
      }
    }
  }, 1000)
}
