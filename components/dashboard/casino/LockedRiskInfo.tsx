'use client'

import { Lock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LockedRiskInfo() {
  const handleUpgradeClick = () => {
    if (process.env.NODE_ENV === 'development') {
      try {} catch {}
    }

    window.location.href = '/ko/account/upgrade'
  }

  return (
    <div
      className="
        pointer-events-auto
        relative z-50
        rounded-2xl
        border border-vipBorder
        bg-black/40
        p-6
        space-y-4
        overflow-hidden
      "
    >
      {/* =========================
         🔴 Stamp Pulse Effect
      ========================= */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -18 }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.15, 0.25, 0.15],
          rotate: -12,
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="
          absolute
          top-6
          right-6
          text-red-500
          font-extrabold
          tracking-widest
          text-4xl
          pointer-events-none
          select-none
        "
        style={{
          textShadow: `
            0 0 8px rgba(255,0,0,0.7),
            0 0 16px rgba(255,0,0,0.6),
            0 0 32px rgba(255,0,0,0.5)
          `,
        }}
      >
        CLASSIFIED
      </motion.div>

      {/* =========================
         🪖 Military HUD Frame
      ========================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="
          absolute inset-0
          border border-red-500/40
          rounded-2xl
          pointer-events-none
        "
      />

      {/* HUD Warning Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="
          absolute
          bottom-3
          right-4
          text-[10px]
          tracking-widest
          text-red-400
          font-mono
          pointer-events-none
        "
      >
        SECURITY LEVEL: SR-4
      </motion.div>

      {/* Header */}
      <div className="flex items-center gap-2 text-red-400">
        <Lock size={16} />
        <span className="text-xs tracking-widest uppercase">
          AI Risk Briefing OS – 보호 레이어
        </span>
      </div>

      {/* Main Message */}
      <div className="text-lg font-semibold text-white">
        이 브리핑 레이어는 공개되지 않습니다
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-400 leading-relaxed">
        현재 시장 환경은 구조적 불안정 상태로 분류되었습니다.
        <br />
        확률 기반 해석의 왜곡을 방지하기 위해
        상세 구조 분석은 제한됩니다.
      </p>

      {/* Footnote */}
      <p className="text-xs text-zinc-500">
        *분석 무결성 유지를 위한 보호 조치입니다
      </p>

      {/* CTA */}
      <button
        type="button"
        onClick={handleUpgradeClick}
        className="
          pointer-events-auto
          mt-2
          text-sm
          font-semibold
          text-zinc-200
          hover:text-white
          underline
          underline-offset-4
          transition-colors
        "
      >
        VIP 권한 요청 →
      </button>
    </div>
  )
}
