'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveRiskState } from '@/lib/realtime/liveRiskState'
import { useRealtimeMarket } from '@/lib/realtime/useRealtimeMarket'
import type { RiskLevel } from '@/lib/vip/riskTypes'

const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  EXTREME: 'text-red-500',
}

export default function VIPLiveStatusStrip() {
  const live = useLiveRiskState(s => s.state)
  const triggerWhalePulse = useLiveRiskState(s => s.triggerWhalePulse)
  const { volume } = useRealtimeMarket('BTCUSDT')

  const prevVolumeRef = useRef<number | null>(null)

  /* ---------------------------
     체결량 방향 계산
  --------------------------- */

  const prevVolume = prevVolumeRef.current
  const delta =
    volume != null && prevVolume != null
      ? volume - prevVolume
      : 0

  const glowColor =
    delta > 0
      ? 'rgba(250,204,21,0.9)'   // 상승 = 골드
      : delta < 0
      ? 'rgba(239,68,68,0.9)'    // 하락 = 레드
      : 'rgba(16,185,129,0.7)'   // 유지 = 에메랄드

  useEffect(() => {
    if (volume != null) {
      prevVolumeRef.current = volume
    }
  }, [volume])

  useEffect(() => {
    if (!live || volume == null) return

    const preExtreme = (live as any)?.preExtreme === true

    const isWhalePulse =
      live.whaleAccelerated &&
      (volume > 500_000 || (preExtreme && volume > 250_000))

    if (isWhalePulse) triggerWhalePulse()
  }, [live, volume, triggerWhalePulse])

  if (!live) return null

  const {
    level,
    direction,
    whaleAccelerated,
    whalePulse,
    durationSec,
  } = live

  const preExtreme = (live as any)?.preExtreme === true
  const isExtreme = level === 'EXTREME'

  const durationText =
    level !== 'LOW' &&
    typeof durationSec === 'number' &&
    durationSec > 0
      ? `· ${Math.floor(durationSec / 60)}분 ${durationSec % 60}초 유지 중`
      : ''

  const volumeKey =
    volume != null ? `vol-${volume}` : 'vol-empty'

  /* ---------------------------
     상단 숫자와 동일 애니메이션
  --------------------------- */

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
          : preExtreme
          ? 'rgba(24,24,27,0.92)'
          : 'rgba(9,9,11,0.85)',
      }}
      transition={{ duration: 0.6 }}
      className="
        sticky top-[64px] z-50 mb-4
        border-b border-neutral-800
        backdrop-blur overflow-hidden
      "
    >
      {/* 상단 흐름 유지 */}
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

      {/* 🔥 위 숫자와 동일 text-sm 통일 */}
      <div className="
        relative max-w-7xl mx-auto
        px-4 py-2
        flex flex-wrap items-center gap-x-8 gap-y-1
        text-sm
      ">

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
          <span>Observing real-time market conditions. ( 실시간 시장을 모니터링중입니다. )</span>
        </div>

        {/* 🔥 실시간 체결량 (상단 숫자와 동일 애니메이션) */}
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
