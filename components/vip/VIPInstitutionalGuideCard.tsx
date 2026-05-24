//components/vip/VIPInstitutionalGuideCard.tsx  

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  long: number
  short: number
  confidence: number
  dominant: 'LONG' | 'SHORT' | 'NONE'
  intensity: number
  isPending?: boolean
}

export default function VIPInstitutionalGuideCard({
  long,
  short,
  confidence,
  dominant,
  intensity,
  isPending = false,
}: Props) {

  const [open, setOpen] = useState(false)

  /* =====================================================
     1️⃣ 색상
  ===================================================== */

  const energyActive = intensity >= 65

  const levelColor =
    energyActive
      ? '#10b981'
      : '#6b7280'

  const strongSignal = energyActive

  /* =====================================================
     2️⃣ 상태 해석
  ===================================================== */

  let phase = '기관 개입 에너지 모니터링 구간'

  let message =
    '시장 내부에서 기관 개입 에너지와 방향 압력 흐름을 추적하고 있습니다.'

  let action =
    '기관 개입 흐름과 시장 압력 변화를 모니터링 중입니다.'

  if (isPending) {
    phase = '기관 개입 활성화 감지 구간'

    message =
      '기관 개입 에너지가 감지되고 있으며 시장 방향 압력 변화 여부를 분석 중입니다.'

    action =
      '기관 개입 활성 흐름 감지'
  }

  else if (confidence >= 45 && dominant === 'LONG') {
    phase = '매수 우위 기관 개입 활성 구간'

    message =
      '기관 개입 에너지와 매수 방향 압력이 동시에 강화되고 있습니다. 현재는 기관 참여 흐름과 시장 개입 압력을 추적하는 단계입니다.'

    action =
      '매수 우위 기관 흐름 모니터링'
  }

  else if (confidence >= 45 && dominant === 'SHORT') {
    phase = '매도 우위 기관 개입 활성 구간'

    message =
      '기관 개입 에너지와 매도 방향 압력이 동시에 강화되고 있습니다. 현재는 기관 참여 흐름과 시장 개입 압력을 추적하는 단계입니다.'

    action =
      '매도 우위 기관 흐름 모니터링'
  }

  else if (confidence >= 30 && dominant === 'LONG') {
    phase = '기관 매수 압력 증가 구간'

    message =
      '기관 개입 에너지 위에서 매수 방향 압력이 점진적으로 증가하고 있습니다.'

    action =
      '기관 매수 압력 관찰'
  }

  else if (confidence >= 30 && dominant === 'SHORT') {
    phase = '기관 매도 압력 증가 구간'

    message =
      '기관 개입 에너지 위에서 매도 방향 압력이 점진적으로 증가하고 있습니다.'

    action =
      '기관 매도 압력 관찰'
  }

  /* =====================================================
     3️⃣ 게이지 퍼센트
  ===================================================== */

  const gaugePercent = Math.min(100, Math.max(0, intensity))

  /* =====================================================
     4️⃣ 배지
  ===================================================== */

  const renderBadge = () => {

    if (isPending)
      return (
        <div className="px-3 py-1 text-xs rounded bg-yellow-500 text-black font-semibold">
          ⏳ 기관 개입 흐름 감지
        </div>
      )

    if (energyActive)
      return (
        <div
          className="px-3 py-1 text-xs rounded font-bold text-black"
          style={{ backgroundColor: levelColor }}
        >
          🧠 기관 개입 흐름 감지
        </div>
      )

    return (
      <div className="px-3 py-1 text-xs rounded bg-zinc-600 text-white">
        기관 개입 에너지 모니터링
      </div>
    )
  }

  /* =====================================================
     5️⃣ 렌더
  ===================================================== */

  return (

    <motion.div
      onClick={() => setOpen(!open)}
      className="relative mt-4 rounded-xl border p-6 text-sm text-neutral-300 cursor-pointer overflow-hidden"
      style={{
        borderColor: levelColor,
        background: strongSignal
          ? `linear-gradient(145deg, rgba(15,15,15,0.95), rgba(0,0,0,0.98))`
          : `linear-gradient(145deg, rgba(15,15,15,0.92), rgba(0,0,0,0.97))`,
        boxShadow: strongSignal
          ? `0 0 45px ${levelColor}55`
          : `0 0 20px ${levelColor}25`,
        animation: strongSignal
          ? 'glow 2.5s ease-in-out infinite alternate'
          : 'none'
      }}
    >

      {/* 상단 상태바 */}

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${gaugePercent}%` }}
        transition={{ duration: 0.8 }}
        className="absolute top-0 left-0 h-[3px]"
        style={{ backgroundColor: levelColor }}
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
            🧠 기관 개입 에너지 모니터링 리포트
          </motion.div>

          <div className="text-xs text-neutral-400">
            (Institutional Intervention Energy Monitoring)
          </div>
        </div>

        {renderBadge()}

      </div>

      {/* 압력 요약 */}

      <div className="mb-4 text-xs text-neutral-400 relative z-10">
        기관 매수 방향 압력 {long.toFixed(0)}%

        <span className="mx-2 text-neutral-600">|</span>

        기관 매도 방향 압력 {short.toFixed(0)}%
      </div>

      {/* Institutional Energy */}

      <div className="mb-4 text-xs text-neutral-400 relative z-10">
        기관 개입 에너지 활성도 {intensity.toFixed(1)}%
      </div>

      {/* 게이지 */}

      <div className="mb-6 relative z-10">

        <div className="text-xs text-neutral-500 mb-1">
          기관 개입 에너지 활성 수준
        </div>

        <div className="w-full h-2 bg-zinc-800 rounded overflow-hidden relative">

          <motion.div
            animate={{ width: `${gaugePercent}%` }}
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
                background: `linear-gradient(90deg, transparent, ${levelColor}55, transparent)`
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

      <div className="text-sm text-neutral-200 relative z-10 leading-relaxed">
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
            • 65% 이상 → 기관 개입 에너지 활성 구간
            <br />
            • 65% 미만 → 기관 개입 에너지 모니터링 구간
            <br />
            • 기관 개입 에너지 활성 수준은 intensity 값을 기준으로 표시됩니다.
            <br />
            • 방향 압력은 long / short 흐름을 함께 참고해 해석합니다.
            <br />
            • 본 지표는 기관 개입 에너지와 시장 압력 흐름을 추적하는 모니터링 레이어입니다.
            <br />
            • 최종 시장 방향성은 온체인·유동성·파생시장 구조와 함께 종합적으로 해석해야 합니다.
            <br />
            ─────────────────────────
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
