'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLiveRiskState } from '@/lib/realtime/liveRiskState'
import { useRealtimeMarket } from '@/lib/realtime/useRealtimeMarket'
import type { RiskLevel } from '@/lib/vip/riskTypes'

const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  EXTREME: 'text-red-500',
}

const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: '시장 안정',
  MEDIUM: '변동성 증가',
  HIGH: '고위험 감지',
  EXTREME: '극단적 위험',
}

export default function VIPLiveStatusStrip() {
  const live = useLiveRiskState(s => s.state)
  const triggerWhalePulse = useLiveRiskState(
    s => s.triggerWhalePulse,
  )

  // ✅ SSOT: PRICE / OI / VOLUME 통합
  const { volume } = useRealtimeMarket('BTCUSDT')

  /* =========================
   * 🔁 Whale pulse trigger
   * ========================= */
  useEffect(() => {
    if (!live) return
    if (volume === undefined || volume === null) return

    // 🔥 [ADD] preExtreme 상태 플래그 (UI 리듬 전용)
    const preExtreme = (live as any)?.preExtreme === true

    // 🔥 [MOD] Whale Pulse 민감도 강화
    // - RiskLevel / 문구 변경 ❌
    // - 리듬(맥박)만 강화
    const isWhalePulse =
      live.whaleAccelerated &&
      (
        volume > 500_000 ||
        (preExtreme && volume > 250_000)
      )

    if (isWhalePulse) {
      triggerWhalePulse()
    }
  }, [live, volume, triggerWhalePulse])

  if (!live) return null

  const {
    level,
    direction,
    whaleAccelerated,
    whalePulse,
    durationSec, // 🔥 Risk 체류 시간
  } = live

  // 🔥 [ADD] preExtreme 상태 (배경 리듬 강화용)
  const preExtreme = (live as any)?.preExtreme === true

  const isExtreme = level === 'EXTREME'

  // 🔥 시장 안정(LOW) 구간에서는 체류 시간 표시하지 않음
  const durationText =
    level !== 'LOW' &&
    typeof durationSec === 'number' &&
    durationSec > 0
      ? `· ${Math.floor(durationSec / 60)}분 ${durationSec % 60}초 유지 중`
      : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{
        opacity: 1,
        y: 0,

        // 🔥 [MOD] preExtreme는 색상 변경 ❌
        // - 배경 밝기·리듬만 미세 강화
        backgroundColor: isExtreme
          ? 'rgba(69,10,10,0.65)'
          : preExtreme
          ? 'rgba(24,24,27,0.92)'
          : 'rgba(9,9,11,0.8)',

        boxShadow: isExtreme
          ? '0 0 40px rgba(239,68,68,0.25)'
          : preExtreme
          ? '0 0 24px rgba(234,179,8,0.12)'
          : '0 0 0 rgba(0,0,0,0)',
      }}
      transition={{
        duration: isExtreme ? 0.4 : preExtreme ? 0.8 : 1.2,
        ease: 'easeOut',
      }}
      className="
        sticky
        top-[64px]
        z-50
        mb-4
        border-b border-neutral-800
        backdrop-blur
      "
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs md:text-sm text-neutral-300">
        {/* 🛡 VIP 보호 상태 */}
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">🛡</span>
          <span>VIP 보호</span>
          <span className="font-semibold text-emerald-300">
            ACTIVE
          </span>
        </div>

        {/* ⚠ Risk 상태 */}
        <div className="flex items-center gap-2">
          <span className={RISK_COLOR[level]}>
            ⚠ 정상모드 (Normal Mode)
          </span>

          {/* 🔽 방향 텍스트 유지 */}
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

          {/* 🔥 Risk 체류 시간 (LOW 제외) */}
          {durationText && (
            <span className="text-zinc-400">
              {durationText}
            </span>
          )}
        </div>

        {/* 🐋 고래 가속 */}
        <div className="flex items-center gap-2">
          <span>🐋</span>
          {whaleAccelerated ? (
            <span className="text-red-400 font-medium">
              고래 출현
            </span>
          ) : (
            <span className="text-neutral-400">
              Observing real-time market conditions. (실시간 시장 상황을 관측 중입니다)
            </span>
          )}
        </div>

        {/* 🔥 실시간 체결량 (Risk / Judgment와 완전 분리) */}
        <div className="flex items-center gap-2">
          <span>🔥</span>
          <span
            className={
              whalePulse
                ? 'text-red-400 font-bold animate-pulse'
                : volume !== undefined &&
                  volume !== null &&
                  volume > 300_000
                ? 'text-yellow-400 font-medium'
                : 'text-neutral-400'
            }
          >
            실시간 체결량{' '}
            {volume !== undefined && volume !== null
              ? volume.toLocaleString()
              : '--'}
            $
          </span>

          {whalePulse && (
            <span className="text-red-400">🐋</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
