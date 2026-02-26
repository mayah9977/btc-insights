'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveRiskState } from '@/lib/realtime/liveRiskState'
import { useRealtimeVolume } from '@/lib/realtime/useRealtimeVolume'
import type { RiskLevel } from '@/lib/vip/riskTypes'

const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  EXTREME: 'text-red-500',
}

function VIPLiveStatusStripComponent() {
  /* =========================
     🔥 Zustand Selector 분리
  ========================= */

  const live = useLiveRiskState(s => s.state)
  const triggerWhalePulse = useLiveRiskState(s => s.triggerWhalePulse)

  /* =========================
     🔥 통합 Market 훅 제거
     → Volume 전용 훅 사용 (렌더 격리)
  ========================= */

  const { volume } = useRealtimeVolume('BTCUSDT')

  const prevVolumeRef = useRef<number | null>(null)

  /* =========================
     체결량 변화 계산
  ========================= */

  const delta = useMemo(() => {
    if (volume == null || prevVolumeRef.current == null) return 0
    return volume - prevVolumeRef.current
  }, [volume])

  const glowColor =
    delta > 0
      ? 'rgba(250,204,21,0.9)'
      : delta < 0
      ? 'rgba(239,68,68,0.9)'
      : 'rgba(16,185,129,0.7)'

  useEffect(() => {
    if (volume != null) {
      prevVolumeRef.current = volume
    }
  }, [volume])

  /* =========================
     Whale Pulse Trigger
  ========================= */

  useEffect(() => {
    if (!live || volume == null) return

    const isWhalePulse =
      live.whaleAccelerated && volume > 500_000

    if (isWhalePulse) triggerWhalePulse()
  }, [live?.whaleAccelerated, volume, triggerWhalePulse])

  if (!live) return null

  const {
    level,
    direction,
    whalePulse,
    startedAt,
  } = live

  const isExtreme = level === 'EXTREME'

  /* =========================
     🔥 duration 직접 계산
     (store tick 제거 상태 유지)
  ========================= */

  const durationSec =
    level !== 'LOW'
      ? Math.floor((Date.now() - startedAt) / 1000)
      : 0

  const durationText =
    level !== 'LOW' && durationSec > 0
      ? `· ${Math.floor(durationSec / 60)}분 ${durationSec % 60}초 유지 중`
      : ''

  const volumeKey =
    volume != null ? `vol-${volume}` : 'vol-empty'

  const numericPulse = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.06, 1],
      textShadow: [
        '0 0 0 rgba(0,0,0,0)',
        `0 0 18px ${glowColor}`,
        '0 0 0 rgba(0,0,0,0)',
      ],
    },
    transition: { duration: 0.6 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: isExtreme
          ? 'rgba(69,10,10,0.65)'
          : 'rgba(9,9,11,0.85)',
      }}
      transition={{ duration: 0.6 }}
      className="
        sticky top-[64px] z-50 mb-4
        border-b border-neutral-800
        backdrop-blur overflow-hidden
      "
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          backgroundPosition: whalePulse
            ? ['0% 0%', '200% 0%']
            : ['0% 0%', '100% 0%'],
        }}
        transition={{
          duration: whalePulse ? 1.2 : 6,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage:
            'linear-gradient(90deg, transparent, rgba(34,197,94,0.08), transparent)',
          backgroundSize: '200% 100%',
        }}
      />

      <div
        className="
        relative max-w-7xl mx-auto
        px-4 py-2
        flex flex-wrap items-center gap-x-8 gap-y-1
        text-sm
      "
      >
        {/* VIP 보호 */}
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="text-emerald-400">🛡</span>
          <span>VIP 보호</span>
          <span className="font-semibold text-emerald-400">
            ACTIVE
          </span>
        </div>

        {/* Risk */}
        <div className="flex items-center gap-2 text-zinc-300">
          <span className={RISK_COLOR[level]}>
            ⚠ 정상모드 (Normal Mode)
          </span>

          <span
            className={
              direction === 'UP'
                ? 'text-red-400'
                : direction === 'DOWN'
                ? 'text-emerald-400'
                : 'text-zinc-400'
            }
          >
            {direction === 'UP'
              ? '▲ 상승'
              : direction === 'DOWN'
              ? '▼ 완화'
              : ''}
          </span>

          {durationText && (
            <span className="text-zinc-400">
              {durationText}
            </span>
          )}
        </div>

        {/* 관측 */}
        <div className="flex items-center gap-2 text-zinc-400">
          <span>🐋</span>
          <span>
            Observing real-time market conditions.
            ( 실시간 시장을 모니터링중입니다. )
          </span>
        </div>

        {/* 실시간 체결량 */}
        <motion.div
          key={volumeKey}
          variants={numericPulse}
          initial="initial"
          animate="animate"
          className="flex items-center gap-1 font-semibold text-emerald-400"
        >
          <span>🔥</span>
          <span>
            실시간 체결량{' '}
            {volume != null
              ? volume.toLocaleString()
              : '--'}
            $
          </span>
        </motion.div>

        <AnimatePresence>
          {whalePulse && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-red-400"
            >
              🐋
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* =========================
   🔥 React.memo 적용
========================= */

export default React.memo(VIPLiveStatusStripComponent)
