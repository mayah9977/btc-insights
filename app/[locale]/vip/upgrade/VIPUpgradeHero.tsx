// app/[locale]/vip/upgrade/VIPUpgradeHero.tsx

'use client'

import { motion } from 'framer-motion'

export default function VIPUpgradeHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.25),transparent_60%)] opacity-70" />

      <div className="relative z-10 text-center">
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-3 text-xs tracking-[0.25em] text-emerald-300/70"
        >
          PREMIUM ACCESS
        </motion.div>

        <h1 className="text-2xl sm:text-3xl font-bold leading-snug break-keep">
          VIP 업그레이드
        </h1>

        <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed break-keep">
          프리미엄 기능을 unlock하고
          <br className="sm:hidden" />
          VIP 전용기능을 사용해서 실제트레이딩에 적용해보세요
        </p>

        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mx-auto mt-5 h-[2px] w-16 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
        />
      </div>
    </motion.div>
  )
}
