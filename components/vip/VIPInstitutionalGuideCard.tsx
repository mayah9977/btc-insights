'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  long: number
  short: number
  confidence: number
  dominant: 'LONG' | 'SHORT' | 'NONE'
  intensity: number   // 🔥 추가 (WhaleIntensity 0~100)
  isPending?: boolean
}

export default function VIPInstitutionalGuideCard({
  long,
  short,
  confidence,
  dominant,
  intensity, // 🔥 추가
  isPending = false,
}: Props) {

  const [open, setOpen] = useState(false)

  /* =====================================================
     1️⃣ 색상 & 강한 정렬 여부
  ===================================================== */

  const levelColor =
    confidence >= 45
      ? dominant === 'LONG'
        ? '#10b981'
        : '#3b82f6'
      : confidence >= 30
      ? '#facc15'
      : '#6b7280'

  const strongSignal = confidence >= 45

  /* =====================================================
     2️⃣ 상태 해석
  ===================================================== */

  let phase = '에너지 축적 구간'
  let message =
    'AI is currently monitoring the market situation.'
  let action = '기관급 고래의 자금 흐름을 모니터링 중입니다.'

  if (isPending) {
    phase = '기관급 고래 체결 감지중'
    message =
      '기관급 체결이 감지되었으며 방향성 여부를 확인 중입니다.'
    action = '기관급 고래 체결 감지됨'
  }
  else if (confidence >= 45 && dominant === 'LONG') {
    phase = '강한 매수 압력 우세'
    message =
      '기관 자금이 매수 방향으로 강화되고 있습니다.'
    action = '강한 매수 압력'
  }
  else if (confidence >= 45 && dominant === 'SHORT') {
    phase = '강한 매도 압력 우세'
    message =
      '기관 자금이 매도 방향으로 강화되고 있습니다.'
    action = '강한 매도 압력'
  }
  else if (confidence >= 30 && dominant === 'LONG') {
    phase = '매수 압력 우세'
    message =
      '기관 순매수 압력이 점진적으로 형성되고 있습니다.'
    action = '매수 우위'
  }
  else if (confidence >= 30 && dominant === 'SHORT') {
    phase = '매도 압력 우세'
    message =
      '기관 순매도 압력이 점진적으로 형성되고 있습니다.'
    action = '매도 우위'
  }

  /* =====================================================
     3️⃣ 게이지 퍼센트
  ===================================================== */

  const gaugePercent = Math.min(100, Math.max(0, confidence))

  /* =====================================================
     4️⃣ 배지
  ===================================================== */

  const renderBadge = () => {

    if (isPending)
      return (
        <div className="px-3 py-1 text-xs rounded bg-yellow-500 text-black font-semibold">
          ⏳ 기관급 고래 체결 감지중.
        </div>
      )

    if (confidence < 15)
      return (
        <div className="px-3 py-1 text-xs rounded bg-zinc-600 text-white">
          기관급 고래 체결 감지중.
        </div>
      )

    if (confidence >= 45)
      return (
        <div
          className="px-3 py-1 text-xs rounded font-bold text-black"
          style={{ backgroundColor: levelColor }}
        >
          🔥 기관급 고래 실시간 체결중.
        </div>
      )

    return (
      <div
        className="px-3 py-1 text-xs rounded text-black"
        style={{ backgroundColor: levelColor }}
      >
        기관급 고래 체결중.
      </div>
    )
  }

  /* =====================================================
     5️⃣ 렌더
  ===================================================== */

  return (
    <motion.div
      onClick={() => setOpen(!open)}
      animate={
        strongSignal
          ? { scale: [1, 1.02, 1] }
          : { scale: 1 }
      }
      transition={{
        duration: 1,
        repeat: strongSignal ? Infinity : 0,
      }}
      className="relative mt-4 rounded-xl border p-6 text-sm text-neutral-300 cursor-pointer overflow-hidden"
      style={{
        borderColor: levelColor,
        background: strongSignal
          ? `linear-gradient(145deg, rgba(15,15,15,0.95), rgba(0,0,0,0.98))`
          : `linear-gradient(145deg, rgba(15,15,15,0.92), rgba(0,0,0,0.97))`,
        boxShadow: strongSignal
          ? `0 0 45px ${levelColor}55`
          : `0 0 20px ${levelColor}25`,
      }}
    >

      {/* 상단 상태바 */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${gaugePercent}%` }}
        transition={{ duration: 0.8 }}
        className="absolute top-0 left-0 h-[3px]"
        style={{
          backgroundColor: levelColor,
        }}
      />

      {/* 라이트 효과 */}
      <AnimatePresence>
        {strongSignal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${levelColor}40 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* 헤더 */}
      <div className="mb-5 flex items-center justify-between relative z-10">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-semibold text-white text-base"
          >
            🧠 기관급 고래의 체결 강도에 따른 리포트
          </motion.div>
          <div className="text-xs text-neutral-400">
            (기관급 고래체결 강도상태 분석)
          </div>
        </div>
        {renderBadge()}
      </div>

      {/* 압력 요약 */}
      <div className="mb-4 text-xs text-neutral-400 relative z-10">
        기관 순매수 압력 {long.toFixed(0)}%
        <span className="mx-2 text-neutral-600">|</span>
        기관 순매도 압력 {short.toFixed(0)}%
      </div>

      {/* 🔥 Whale Intensity 표시 */}
      <div className="mb-4 text-xs text-neutral-400 relative z-10">
        기관급 고래 체결강도 {intensity.toFixed(1)}%
      </div>

      {/* 게이지 */}
      <div className="mb-6 relative z-10">
        <div className="text-xs text-neutral-500 mb-1">
          기관 방향성 신뢰도
        </div>

        <div className="w-full h-2 bg-zinc-800 rounded overflow-hidden relative">
          <motion.div
            animate={{
              width: `${gaugePercent}%`,
            }}
            transition={{ duration: 0.6 }}
            className="h-full"
            style={{ backgroundColor: levelColor }}
          />

          {strongSignal && (
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, transparent, ${levelColor}55, transparent)`,
              }}
            />
          )}
        </div>
      </div>

      {/* 상태 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-sm font-semibold mb-2 relative z-10"
        style={{ color: levelColor }}
      >
        {phase}
      </motion.div>

      <div className="text-sm text-neutral-200 relative z-10">
        {message}
      </div>

      <div className="mt-4 text-center text-xs font-semibold text-white relative z-10">
        Current Status: {action}
      </div>

      {/* 상세 설명 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-5 text-xs text-neutral-500 leading-relaxed relative z-10"
          >
            ─────────────────────────
            <br />
            • 45% 이상 → 강한 고래체결 확정 (추세 시작)  
            • 30~44% → 방향 형성 단계  
            • 15~29% → 준비 구간  
            • 15% 미만 → 에너지 축적 단계  
            <br />
            • 신호는 최소 3초 이상 유지 시 확정됩니다.
            <br />
            ─────────────────────────
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
