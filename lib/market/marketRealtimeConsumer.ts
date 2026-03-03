import { createRedisSubscriber } from '@/lib/redis'
import { redis } from '@/lib/redis'
import { deriveOpenInterest } from './deriveOpenInterest'

import {
  setLastOI,
  setLastVolume,
  setLastFundingRate,
  pushRecentPrice,
  setLastActionGateInput,
  setActionGateState,
  setLastBollingerSignal,
  getLastMACD,
  setLastFinalDecision,
  getRecentPrices,
  setLastMACD,
} from '@/lib/market/marketLastStateStore'

import { calculateMACD } from '@/lib/market/macd'

import { pushRollingValue } from '@/lib/market/statsRolling'
import { CandleAggregator30m } from '@/lib/market/candleAggregator30m'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

import { buildRiskInputFromRealtime } from '@/lib/market/buildRiskInputFromRealtime'
import { getActionGateState } from '@/lib/market/action/getActionGateState'
import type { ActionGateInput } from '@/lib/market/actionGate/actionGateInput'

import { calculateInstitutionalProbability } from '@/lib/market/institutionalProbability'
import { evaluateDecisionEngine } from '@/lib/market/actionGate/decisionEngine'
import { setLastDecision } from '@/lib/market/store/decisionStateStore'

import { calculateFMAI } from '@/lib/market/momentum/futuresMomentumAlignment'
import { setLastFMAI } from '@/lib/market/store/fmaiStateStore'

/* ========================= */
const RAW_CHANNEL = 'realtime:raw'
const DERIVED_PUBLIC = 'realtime:derived:public'
const DERIVED_VIP = 'realtime:derived:vip'

const DEFAULT_SYMBOLS = ['BTCUSDT']

const g = globalThis as any

if (!g.__MARKET_CONSUMER_STARTED__) {
  g.__MARKET_CONSUMER_STARTED__ = true

  const candle30mMap: Record<string, CandleAggregator30m> = {}
  const sub = createRedisSubscriber()
  sub.subscribe(RAW_CHANNEL)

  const activeSymbols = new Set<string>(DEFAULT_SYMBOLS)
  const lastPriceMap = new Map<string, number>()

  /* 🔥 Rate Limit Maps */
  const lastBBPublish = new Map<string, number>()
  const lastWhalePublish = new Map<string, number>()

  /* ================= RAW → PUBLIC ================= */
  sub.on('message', async (_channel, raw) => {
    try {
      const event = JSON.parse(raw)
      if (!event?.symbol) return

      const symbol = event.symbol.toUpperCase()
      activeSymbols.add(symbol)

      /* OI */
      if (event.type === 'OI_TICK') {
        setLastOI(symbol, event.openInterest)
        pushRollingValue(`OI_${symbol}`, event.openInterest, 50)

        const derived = deriveOpenInterest(symbol, event.openInterest)

        redis.publish(
          DERIVED_PUBLIC,
          JSON.stringify({
            type: 'OI_TICK',
            symbol,
            ...derived,
            ts: event.ts ?? Date.now(),
          }),
        )
      }

      /* Volume */
      if (event.type === 'VOLUME_TICK') {
        setLastVolume(symbol, event.volume)
        redis.publish(DERIVED_PUBLIC, JSON.stringify(event))
      }

      /* Funding */
      if (event.type === 'FUNDING_RATE_TICK') {
        setLastFundingRate(symbol, event.fundingRate)
        redis.publish(DERIVED_PUBLIC, JSON.stringify(event))
      }

      /* Price */
      if (event.type === 'PRICE_TICK') {
        const price = event.price
        const ts = event.ts
        if (!Number.isFinite(ts)) return

        pushRecentPrice(symbol, price)
        redis.publish(DERIVED_PUBLIC, JSON.stringify(event))

        candle30mMap[symbol] ??= new CandleAggregator30m(symbol)
        const aggregator = candle30mMap[symbol]
        const result = aggregator.update({ price, ts }, 0)

        /* Confirmed */
        if (result.confirmedSignal) {
          setLastBollingerSignal(symbol, {
            enabled: true,
            timeframe: '30m',
            symbol,
            signalType: result.confirmedSignal.signalType as BollingerSignalType,
            candle: result.confirmedSignal.candle,
            bands: result.confirmedSignal.bands,
            confirmed: true,
            at: result.confirmedSignal.at,
          })

          redis.publish(
            DERIVED_PUBLIC,
            JSON.stringify(result.confirmedSignal),
          )
        }

        /* 🔥 Realtime Bollinger (800ms rate limit) */
        if (result.liveCommentary) {
          const now = Date.now()
          const last = lastBBPublish.get(symbol) ?? 0

          if (now - last > 800) {
            lastBBPublish.set(symbol, now)

            setLastBollingerSignal(symbol, {
              enabled: true,
              timeframe: '30m',
              symbol,
              signalType: result.liveCommentary.signalType as BollingerSignalType,
              candle: result.liveCommentary.candle,
              bands: result.liveCommentary.bands,
              confirmed: false,
              at: result.liveCommentary.at,
            })

            redis.publish(
              DERIVED_PUBLIC,
              JSON.stringify(result.liveCommentary),
            )
          }
        }
      }

      if (event.type === 'WHALE_TRADE_FLOW') {
        redis.publish(DERIVED_PUBLIC, JSON.stringify(event))
      }

      if (event.type === 'WHALE_NET_PRESSURE') {
        redis.publish(DERIVED_PUBLIC, JSON.stringify(event))
      }

    } catch (e) {
      console.error('[MARKET CONSUMER] parse error', e)
    }
  })

  /* ================= CORE LOOP ================= */
  setInterval(async () => {
    for (const symbol of activeSymbols) {
      try {
        const snapshot = await buildRiskInputFromRealtime(symbol)
        if (!snapshot) continue

        /* MACD */
        const recentCloses = getRecentPrices(symbol, 100)
        if (recentCloses.length >= 35) {
          const macdResult = calculateMACD(recentCloses)
          if (macdResult) setLastMACD(symbol, macdResult)
        }

        /* FMAI */
        const prevPrice = lastPriceMap.get(symbol) ?? snapshot.price
        const priceChange =
          prevPrice !== 0
            ? (snapshot.price - prevPrice) / prevPrice
            : 0

        lastPriceMap.set(symbol, snapshot.price)

        const fmai = calculateFMAI({
          priceChange,
          oiDeltaRatio: snapshot.oiDeltaRatio,
          volumeRatio: snapshot.volumeRatio,
        })

        setLastFMAI(symbol, fmai, snapshot.ts)

        const publishTasks: Promise<any>[] = []

        publishTasks.push(
          redis.publish(
            DERIVED_VIP,
            JSON.stringify({
              type: 'FMAI',
              symbol,
              score: fmai.score,
              direction: fmai.direction,
              ts: snapshot.ts,
            }),
          )
        )

        /* 🔥 Whale Intensity (1초 rate limit) */
        const now = Date.now()
        const lastWhale = lastWhalePublish.get(symbol) ?? 0

        if (now - lastWhale > 1000) {
          lastWhalePublish.set(symbol, now)

          publishTasks.push(
            redis.publish(
              DERIVED_PUBLIC,
              JSON.stringify({
                type: 'WHALE_INTENSITY',
                symbol,
                intensity: snapshot.whaleIntensity,
                avg: 0,
                trend:
                  snapshot.whaleNetRatio > 0
                    ? 'UP'
                    : snapshot.whaleNetRatio < 0
                    ? 'DOWN'
                    : 'FLAT',
                isSpike: snapshot.extremeSignal,
                ts: snapshot.ts,
              }),
            )
          )
        }

        /* Action Gate */
        const nextActionGateInput: ActionGateInput = {
          bollingerSignal: snapshot.bollingerSignal,
          oiDelta: snapshot.oiDelta,
          oiDeltaRatio: snapshot.oiDeltaRatio,
          fundingRate: snapshot.fundingRate,
          macd: getLastMACD(symbol),
          whalePressure: snapshot.whalePressure,
        }

        const gateResult = getActionGateState(nextActionGateInput)
        const actionGateState = gateResult.state

        setActionGateState(symbol, actionGateState)
        setLastActionGateInput(symbol, nextActionGateInput)

        /* Decision */
        const probability =
          calculateInstitutionalProbability({
            whaleRatio: snapshot.whaleRatio ?? 0,
            netRatio: snapshot.whaleNetRatio ?? 0,
            oiDelta: snapshot.oiDelta ?? 0,
            isSpike: snapshot.extremeSignal ?? false,
            fundingBias: snapshot.fundingBias,
          })

        const decision = evaluateDecisionEngine({
          symbol,
          actionGateState,
          bollingerSignal: snapshot.bollingerSignal,
          macd: nextActionGateInput.macd,
          probability,
          fmai,
        })

        setLastDecision(symbol, decision, {
          dominant: probability.dominant,
          confidence: probability.confidence,
        })

        setLastFinalDecision(
          symbol,
          decision,
          probability.dominant,
          probability.confidence,
        )

        publishTasks.push(
          redis.publish(
            DERIVED_VIP,
            JSON.stringify({
              type: 'FINAL_DECISION',
              symbol,
              decision,
              dominant: probability.dominant,
              confidence: probability.confidence,
              ts: snapshot.ts,
            }),
          )
        )

        publishTasks.push(
          redis.publish(
            DERIVED_VIP,
            JSON.stringify({
              type: 'MARKET_STATE',
              symbol,
              actionGateState,
              macd: nextActionGateInput.macd,
              ts: snapshot.ts,
            }),
          )
        )

        /* 🔥 병렬 publish */
        await Promise.all(publishTasks)

      } catch (err) {
        console.error('[CORE ENGINE ERROR]', err)
      }
    }
  }, 1000)
}
