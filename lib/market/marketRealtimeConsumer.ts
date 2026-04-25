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

import { detectInstitutionalAccumulation } from '@/lib/market/detector/institutionalAccumulationDetector'
import { setInstitutionalState } from '@/lib/market/store/institutionalStateStore'
import { detectWhaleAbsorption } from '@/lib/market/detector/whaleAbsorptionDetector'
import { detectMarketRegime } from '@/lib/market/regime/marketRegimeDetector'
import { detectLiquiditySweep } from '@/lib/market/liquidity/liquiditySweepDetector'

const RAW_CHANNEL = 'realtime:raw'
const DERIVED_PUBLIC = 'realtime:derived:public'
const DERIVED_VIP = 'realtime:derived:vip'

const DEFAULT_SYMBOLS = ['BTCUSDT']

/**
 * ✅ PRICE_TICK 다운샘플 (100ms 권장)
 * - 100ms: 차트/UI 부드럽고 이벤트 폭주 크게 감소
 * - 더 줄이고 싶으면 250ms / 1000ms로 변경
 */
const PRICE_PUBLISH_INTERVAL_MS = 100

const g = globalThis as any

if (!g.__MARKET_CONSUMER_STARTED__) {
  g.__MARKET_CONSUMER_STARTED__ = true

  const candle30mMap: Record<string, CandleAggregator30m> = {}

  const sub = createRedisSubscriber()
  sub.subscribe(RAW_CHANNEL)

  const activeSymbols = new Set<string>(DEFAULT_SYMBOLS)

  const lastPriceMap = new Map<string, number>()

  const lastBBPublish = new Map<string, number>()
  const lastWhalePublish = new Map<string, number>()

  /* ✅ PRICE_TICK publish 다운샘플 상태 */
  const lastPricePublishAt = new Map<string, number>()
  const pendingPriceEvent = new Map<string, any>()

  sub.on('message', async (_channel, raw) => {
    try {
      const event = JSON.parse(raw)

      if (!event?.symbol) return
      const symbol = event.symbol.toUpperCase()

      activeSymbols.add(symbol)

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

      if (event.type === 'VOLUME_TICK') {
        setLastVolume(symbol, event.volume)
        redis.publish(DERIVED_PUBLIC, JSON.stringify(event))
      }

      if (event.type === 'FUNDING_RATE_TICK') {
        setLastFundingRate(symbol, event.fundingRate)
        redis.publish(DERIVED_PUBLIC, JSON.stringify(event))
      }

      if (event.type === 'PRICE_TICK') {
        const price = event.price
        const ts = event.ts

        if (!Number.isFinite(ts)) return

        // ✅ SSOT/파생 계산은 원본 그대로 유지 (정확도 유지)
        pushRecentPrice(symbol, price)

        candle30mMap[symbol] ??= new CandleAggregator30m(symbol)
        const aggregator = candle30mMap[symbol]
        const result = aggregator.update({ price, ts }, 0)

        // ✅ PRICE_TICK publish는 다운샘플 (UI/차트 부하 감소)
        pendingPriceEvent.set(symbol, event)

        const now = Date.now()
        const last = lastPricePublishAt.get(symbol) ?? 0

        if (now - last >= PRICE_PUBLISH_INTERVAL_MS) {
          lastPricePublishAt.set(symbol, now)

          const latest = pendingPriceEvent.get(symbol) ?? event
          pendingPriceEvent.delete(symbol)

          redis.publish(DERIVED_PUBLIC, JSON.stringify(latest))
        }

        // ✅ Bollinger publish는 기존 로직 유지
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
          redis.publish(DERIVED_PUBLIC, JSON.stringify(result.confirmedSignal))
        }

        if (result.liveCommentary) {
          const now2 = Date.now()
          const last2 = lastBBPublish.get(symbol) ?? 0

          if (now2 - last2 > 800) {
            lastBBPublish.set(symbol, now2)

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
            redis.publish(DERIVED_PUBLIC, JSON.stringify(result.liveCommentary))
          }
        }
      }

      if (event.type === 'WHALE_TRADE_FLOW') {
        redis.publish(DERIVED_PUBLIC, JSON.stringify(event))
      }

      if (event.type === 'WHALE_NET_PRESSURE') {
        redis.publish(DERIVED_PUBLIC, JSON.stringify(event))
      }
    } catch (e) {}
  })

  /**
   * ✅ 다운샘플 interval 내에 publish가 한 번도 안 일어난 경우
   * 마지막 이벤트를 '플러시'해서 UI가 굶지 않게 함
   */
  setInterval(() => {
    const now = Date.now()

    for (const [symbol, latest] of pendingPriceEvent) {
      const last = lastPricePublishAt.get(symbol) ?? 0
      if (now - last >= PRICE_PUBLISH_INTERVAL_MS) {
        lastPricePublishAt.set(symbol, now)
        pendingPriceEvent.delete(symbol)
        try {
          redis.publish(DERIVED_PUBLIC, JSON.stringify(latest))
        } catch {}
      }
    }
  }, PRICE_PUBLISH_INTERVAL_MS)

  setInterval(async () => {
    for (const symbol of activeSymbols) {
      try {
        const snapshot = await buildRiskInputFromRealtime(symbol)
        if (!snapshot) continue

        const recentCloses = getRecentPrices(symbol, 100)

        if (recentCloses.length >= 35) {   
          const macdResult = calculateMACD(recentCloses)
          if (macdResult) setLastMACD(symbol, macdResult)
        }

        const prevPrice = lastPriceMap.get(symbol) ?? snapshot.price

        const priceChange =
          prevPrice !== 0 ? (snapshot.price - prevPrice) / prevPrice : 0

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
          ),
        )

        const absorption = detectWhaleAbsorption({
          priceChange,
          whaleBuyVolume: snapshot.whaleBuyVolume ?? 0,
          whaleSellVolume: snapshot.whaleSellVolume ?? 0,
          whaleRatio: snapshot.whaleRatio ?? 0,
          volumeRatio: snapshot.volumeRatio ?? 1,
        })

        if (absorption.detected) {
          publishTasks.push(
            redis.publish(
              DERIVED_VIP,
              JSON.stringify({
                type: 'WHALE_ABSORPTION',
                symbol,
                direction: absorption.direction,
                strength: absorption.strength,
                confidence: absorption.confidence,
                ts: snapshot.ts,
              }),
            ),
          )
        }

        const regime = detectMarketRegime({
          volatility: snapshot.volatility ?? 0,
          oiDeltaRatio: snapshot.oiDeltaRatio ?? 0,
          volumeRatio: snapshot.volumeRatio ?? 1,
        })

        publishTasks.push(
          redis.publish(
            DERIVED_VIP,
            JSON.stringify({
              type: 'MARKET_REGIME',
              symbol,
              regime: regime.regime,
              strength: regime.strength,
              confidence: regime.confidence,
              ts: snapshot.ts,
            }),
          ),
        )

        const recentPrices = getRecentPrices(symbol, 20)

        const sweep = detectLiquiditySweep({
          recentPrices,
          volumeRatio: snapshot.volumeRatio ?? 1,
          volatility: snapshot.volatility ?? 0,
        })

        if (sweep.detected) {
          publishTasks.push(
            redis.publish(
              DERIVED_VIP,
              JSON.stringify({
                type: 'LIQUIDITY_SWEEP',
                symbol,
                direction: sweep.direction,
                strength: sweep.strength,
                confidence: sweep.confidence,
                ts: snapshot.ts,
              }),
            ),
          )
        }

        const fundingBiasValue =
          snapshot.fundingBias === 'LONG_HEAVY'
            ? 1
            : snapshot.fundingBias === 'SHORT_HEAVY'
            ? -1
            : 0

        const institutional = detectInstitutionalAccumulation({
          whaleRatio: snapshot.whaleRatio ?? 0,
          whaleNetRatio: snapshot.whaleNetRatio ?? 0,
          oiDelta: snapshot.oiDelta ?? 0,
          fmaiScore: fmai.score,
          fundingBias: fundingBiasValue,
        })

        setInstitutionalState(symbol, {
          detected: institutional.detected,
          direction: institutional.direction,
          confidence: institutional.confidence,
          ts: snapshot.ts,
        })

        if (institutional.detected) {
          publishTasks.push(
            redis.publish(
              DERIVED_VIP,
              JSON.stringify({
                type: 'INSTITUTIONAL_ACCUMULATION',
                symbol,
                direction: institutional.direction,
                confidence: institutional.confidence,
                ts: snapshot.ts,
              }),
            ),
          )
        }

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
            ),
          )
        }

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

        const probability = calculateInstitutionalProbability({
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
          ),
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
          ),
        )

        await Promise.all(publishTasks)
      } catch {}
    }
  }, 1000)
} 
