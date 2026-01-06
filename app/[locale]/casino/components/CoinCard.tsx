'use client'

import { useEffect, useMemo, useRef } from 'react'
import clsx from 'clsx'

import { useWhaleHistory } from '../lib/whaleHistoryStore'
import { useWhaleTrigger } from '../lib/whaleTriggerStore'
import { useWhaleCooldown } from '../lib/whaleCooldown'

import { calcEntryFailureProbability } from '../lib/entryFailureProbability'
import type { VIPLevel } from '../lib/vipProbabilityCurve'

import { getDangerThreshold } from '../lib/vipDangerThreshold'
import { useDangerZoneLog } from '../lib/dangerZoneLogStore'
import { useWhaleHeatmapFocus } from '../lib/whaleHeatmapFocusStore'
import { useVIPNotification } from '../lib/vipNotificationStore'
import { playVIPRiskSound } from '../lib/vipRiskSound'

import { POLICY } from 'lib/policy/switch'

import AIScoreRing from './AIScoreRing'
import VIPRiskMeter from './VIPRiskMeter'
import TrendBadge from './TrendBadge'
import VIPPreviewCTA from './VIPPreviewCTA'

import { generateAISignalSentence } from '../lib/ai/aiSignalSentence'

type Props = {
  symbol: string
  aiScore: number
  vipLevel: VIPLevel
}

function resolveState(score: number) {
  if (score >= 75)
    return { label: 'STRONG', color: 'bg-emerald-500/20 text-emerald-300' }
  if (score >= 60)
    return { label: 'NEUTRAL', color: 'bg-sky-500/20 text-sky-300' }
  if (score >= 45)
    return { label: 'WEAK', color: 'bg-yellow-500/20 text-yellow-300' }
  return { label: 'DANGER', color: 'bg-red-500/20 text-red-300' }
}

export default function CoinCard({
  symbol,
  aiScore,
  vipLevel,
}: Props) {
  const { logs } = useWhaleHistory()
  const { whaleActive, triggerWhale } = useWhaleTrigger()
  const { remainingMs, cooldownMs, triggerCooldown } =
    useWhaleCooldown(symbol)

  const { push: pushDangerLog } = useDangerZoneLog()
  const { setSymbol: focusHeatmap } = useWhaleHeatmapFocus()
  const { push: pushVIPNotify } = useVIPNotification()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const dangerEnteredRef = useRef(false)

  const isVIP = vipLevel !== 'FREE'
  const dangerThreshold = getDangerThreshold(vipLevel)
  const state = resolveState(aiScore)

  /* EXTREME 판정 */
  const extreme = useMemo(() => {
    let streak = 0
    for (const l of logs) {
      if (l.symbol !== symbol) continue
      if (l.intensity === 'HIGH') {
        streak++
        if (streak >= 3) return true
      } else break
    }
    return false
  }, [logs, symbol])

  /* 실패 확률 */
  const failureProb = useMemo(
    () =>
      calcEntryFailureProbability({
        aiScore,
        cooldownMs,
        extreme,
        vipLevel,
      }),
    [aiScore, cooldownMs, extreme, vipLevel]
  )

  /* AI 문장 */
  const aiSentence = useMemo(
    () =>
      generateAISignalSentence({
        aiScore,
        volatility: extreme ? 0.8 : 0.6,
        whaleBias: 'NEUTRAL',
      }),
    [aiScore, extreme]
  )

  /* Danger Zone 처리 */
  useEffect(() => {
    if (
      POLICY.enableExtremeVisuals &&
      failureProb >= dangerThreshold &&
      !dangerEnteredRef.current
    ) {
      dangerEnteredRef.current = true

      triggerWhale({ intensity: 'HIGH' })
      focusHeatmap(symbol)

      pushDangerLog({
        symbol,
        probability: failureProb,
        ts: Date.now(),
      })

      if (isVIP) {
        pushVIPNotify({
          id: crypto.randomUUID(),
          priority: 'HIGH',
          message: `⚠️ ${symbol} Risk Increased (${vipLevel})`,
          ts: Date.now(),
          symbol,
        })

        if (POLICY.enableSound) {
          playVIPRiskSound(failureProb)
        }
      }
    }

    if (failureProb < dangerThreshold) {
      dangerEnteredRef.current = false
    }
  }, [
    failureProb,
    dangerThreshold,
    symbol,
    vipLevel,
    isVIP,
    triggerWhale,
    focusHeatmap,
    pushDangerLog,
    pushVIPNotify,
  ])

  const progress =
    cooldownMs > 0 ? 1 - remainingMs / cooldownMs : 1

  const canEntry =
    isVIP &&
    whaleActive &&
    remainingMs === 0 &&
    POLICY.enableEntryUI

  return (
    <div
      id={`coin-${symbol}`}
      className={clsx(
        'relative rounded-2xl border p-5 bg-neutral-900',
        'transition-all duration-300',
        'hover:border-neutral-500 hover:shadow-lg',
        whaleActive &&
          POLICY.enableExtremeVisuals &&
          'border-red-500',
        extreme &&
          POLICY.enableExtremeVisuals &&
          'ring-2 ring-red-500/60'
      )}
    >
      <audio ref={audioRef} src="/sounds/extreme.mp3" preload="auto" />

      {extreme && POLICY.enableExtremeVisuals && (
        <div className="absolute -top-3 -right-3 bg-red-500 text-black text-xs font-extrabold px-2 py-1 rounded">
          EXTREME
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-slate-100">
          {symbol}
        </h3>
        <TrendBadge text={state.label} className={state.color} />
      </div>

      {/* AI Ring */}
      <div className="flex justify-center mb-3">
        <AIScoreRing
          score={aiScore}
          progress={progress}
          mode={remainingMs > 0 ? 'cooldown' : 'normal'}
          highlight={extreme && POLICY.enableExtremeVisuals}
          failureProb={failureProb}
          vip={isVIP}
        />
      </div>

      {/* AI Sentence */}
      <p className="text-sm text-slate-300 leading-relaxed">
        {aiSentence}
      </p>

      {/* VIP Risk Meter */}
      {isVIP && POLICY.enableRiskMeter && (
        <VIPRiskMeter probability={failureProb} />
      )}

      {/* ENTRY */}
      <button
        onClick={() => {
          if (canEntry) triggerCooldown(1, extreme)
        }}
        disabled={!canEntry}
        className={clsx(
          'w-full rounded-lg py-2 font-semibold mt-3 transition',
          canEntry
            ? 'bg-red-500 text-white hover:bg-red-400'
            : 'bg-neutral-700 text-slate-400'
        )}
      >
        {POLICY.entryLabelSafe ? '신호 확인' : 'ENTRY'}
      </button>

      {/* FREE → VIP */}
      {!isVIP && (
        <div className="mt-3">
          <VIPPreviewCTA preview={aiSentence} />
        </div>
      )}

      {/* Disclaimer */}
      {POLICY.disclaimerRequired && (
        <p className="mt-2 text-xs text-slate-400">
          본 정보는 투자 또는 거래를 권유하지 않으며
          참고용 시각화 데이터입니다.
        </p>
      )}
    </div>
  )
}
