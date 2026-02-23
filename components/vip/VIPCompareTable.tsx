'use client'

import { motion } from 'framer-motion'

export default function VIPCompareTable() {
  return (
    <section className="relative mt-24">

      {/* subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[300px] bg-yellow-500/5 blur-[120px]" />
      </div>

      <div className="relative grid md:grid-cols-2 gap-10">

        {/* =========================
           FREE CARD
        ========================= */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
          className="
            relative
            rounded-3xl
            border border-neutral-800
            bg-gradient-to-b from-neutral-900/80 to-neutral-950
            backdrop-blur-xl
            p-8
            space-y-6
            shadow-[0_20px_80px_rgba(0,0,0,0.7)]
          "
        >
          <div className="text-xs uppercase tracking-widest text-neutral-500">
            Standard Tier
          </div>

          <h3 className="text-2xl font-bold text-white">
            FREE Access
          </h3>

          <p className="text-sm text-neutral-400 leading-relaxed">
            기본 시장 알림 및 구조 요약 기능 제공
          </p>

          <ul className="text-sm text-neutral-400 space-y-3">
            <li>• 실시간 기본 알림 수신</li>
            <li>• 제한된 이벤트 기록 열람</li>
          </ul>

          <div className="pt-6 border-t border-neutral-800 text-xs text-neutral-600">
            기본 알림 시스템 접근 권한
          </div>
        </motion.div>

        {/* =========================
           VIP CARD
        ========================= */}
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ duration: 0.3 }}
          className="
            relative
            rounded-3xl
            border border-yellow-500/30
            bg-gradient-to-b from-yellow-500/10 via-neutral-900 to-neutral-950
            backdrop-blur-xl
            p-8
            space-y-6
            shadow-[0_0_60px_rgba(250,204,21,0.15)]
            overflow-hidden
          "
        >
          {/* premium badge */}
          <div className="
            absolute top-6 right-6
            text-[10px]
            px-3 py-1
            rounded-full
            bg-yellow-500/20
            text-yellow-300
            tracking-wider
          ">
            PREMIUM
          </div>

          <div className="text-xs uppercase tracking-widest text-yellow-400">
            Intelligent System Tier
          </div>

          <h3 className="text-2xl font-bold text-yellow-400">
            VIP Intelligent AI Trading OS
          </h3>

          <p className="text-sm text-neutral-300 leading-relaxed">
            전체 AI 리스크 관측 시스템에 대한 완전 접근
          </p>

          <ul className="text-sm text-neutral-200 space-y-3">
            <li>• 🧠 AI 기반 리스크 구조 분석</li>
            <li>• 🐋 Whale Intensity 실시간 추적</li>
            <li>• 📊 중장기 시장 해석 레이어</li>
            <li>• 🔔 고급 이벤트 히스토리</li>
            <li>• 📄 VIP 리포트 다운로드</li>
            <li>• ⚡ SSE 기반 실시간 시스템</li>
          </ul>

          <div className="pt-6 border-t border-yellow-500/20 text-xs text-yellow-300">
            Full System Access
          </div>

          {/* animated glow border */}
          <div className="
            absolute inset-0
            rounded-3xl
            pointer-events-none
            border border-yellow-400/10
            animate-pulse
          " />
        </motion.div>
      </div>
    </section>
  )
}
