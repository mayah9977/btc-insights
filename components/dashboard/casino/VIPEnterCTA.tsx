'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useVipOverviewStore } from '@/lib/vip/overviewStore'

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

/**
 * 위험 단계별 CTA 문구
 * - 과장 ❌
 * - 보호/제한 톤만 강화
 */
const phraseByRisk: Record<
  RiskLevel,
  { title: string; sub: string }
> = {
  LOW: {
    title: '현재 판단을 확인해보세요',
    sub: '이 구간의 시장 해석을 제공합니다',
  },
  MEDIUM: {
    title: '지금 흐름의 의미를 확인하세요',
    sub: '방향성 시도에 대한 해석이 포함됩니다',
  },
  HIGH: {
    title: '왜 지금이 위험한지 확인하기',
    sub: '반복된 경고 신호의 근거가 포함됩니다',
  },
  EXTREME: {
    title: '이 구간은 공개되지 않습니다',
    sub: '과열 구간의 상세 판단은 제한됩니다',
  },
}

/**
 * 체류 시간 기반 테두리 톤
 */
function borderByDwell(sec: number) {
  if (sec < 5) return 'border-vipBorder'
  if (sec < 12) return 'border-vipAccent'
  return 'border-vipDanger'
}

/**
 * VIP Enter CTA
 * - 판단 ❌
 * - 계산 ❌
 * - FREE → VIP 전환 퍼널 최종 관문
 */
export default function VIPEnterCTA() {
  const router = useRouter()
  const { riskLevel } = useVipOverviewStore()

  /* =========================
     Dwell Time Tracking
  ========================= */
  const [dwell, setDwell] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setDwell((d) => d + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  /* =========================
     Very Short Sound Cue
  ========================= */
  const audioRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    audioRef.current = new Audio('/sounds/click-soft.mp3')
    audioRef.current.volume = 0.25
  }, [])

  const phrase = phraseByRisk[riskLevel]
  const borderTone = borderByDwell(dwell)

  return (
    <>
      <audio ref={audioRef} />

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onMouseDown={() => audioRef.current?.play()}
        onClick={() => router.push('/ko/casino/vip')}
        className={`w-full rounded-2xl border ${borderTone}
          bg-gradient-to-r from-red-600/30 to-red-900/40
          p-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.7)]
          space-y-3 transition-colors`}
      >
        {/* Restricted Label */}
        <div className="text-xs tracking-widest uppercase text-red-300">
          Restricted Area
        </div>

        {/* Main Copy */}
        <div className="text-xl font-extrabold text-white">
          {phrase.title}
        </div>

        {/* Sub Copy */}
        <div className="text-sm text-zinc-300">
          {phrase.sub}
        </div>

        {/* Dwell-based Last Sentence */}
        {dwell > 8 && (
          <div className="pt-1 text-xs text-zinc-400">
            이 정보는{' '}
            <b className="text-zinc-300">지금 이 순간</b>에만
            의미를 가집니다
          </div>
        )}
      </motion.button>
    </>
  )
}
