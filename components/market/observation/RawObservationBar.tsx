'use client'

import { motion } from 'framer-motion'
import { useRealtimeOI } from '@/lib/realtime/useRealtimeOI'
import { useRealtimeVolume } from '@/lib/realtime/useRealtimeVolume'
import { useRealtimeFundingRate } from '@/lib/realtime/useRealtimeFundingRate' // ✅ 수정
import { NumericAnimatedValue } from '@/components/ui/NumericAnimatedValue'

interface RawObservationBarProps {
  symbol: string
}

export function RawObservationBar({ symbol }: RawObservationBarProps) {
  const oiState = useRealtimeOI(symbol)
  const volumeState = useRealtimeVolume(symbol)

  // ✅ Funding 훅 교체
  const fundingState = useRealtimeFundingRate(symbol)
  const fundingRate = fundingState.fundingRate

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden"
    >
      {/* Luxury moving light sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundImage:
            'linear-gradient(90deg, transparent, rgba(16,185,129,0.05), transparent)',
          backgroundSize: '200% 100%',
        }}
      />

      {/* 상단 라인 */}
      <div
        aria-hidden
        className="
          absolute top-0 left-0 right-0 h-px
          bg-gradient-to-r
          from-transparent
          via-white/15
          to-transparent
        "
      />

      <div className="relative px-4 py-6">
        <div className="flex flex-col gap-6 md:flex-row md:flex-wrap md:items-center md:gap-16">

          {/* ================= OI ================= */}
          <div className="flex flex-wrap items-baseline gap-3 md:gap-5">
            <span className="text-sm font-semibold text-zinc-300 tracking-widest uppercase opacity-80">
              Open Interest (미결제약정)
            </span>

            <NumericAnimatedValue
              value={oiState.openInterest}
              size="lg"
              glowMode="direction"
              className="font-bold text-emerald-400 tracking-wide"
            />
          </div>

          {/* ================= Volume ================= */}
          <div className="flex flex-wrap items-baseline gap-3 md:gap-5">
            <span className="text-sm font-semibold text-zinc-300 tracking-widest uppercase opacity-80">
              Volume (거래량)
            </span>

            <NumericAnimatedValue
              value={volumeState.volume}
              size="lg"
              glowMode="direction"
              suffix={volumeState.volume != null ? ' K' : ''}
              className="font-bold text-emerald-400 tracking-wide"
            />
          </div>

          {/* ================= Funding ================= */}
          <div className="flex flex-wrap items-baseline gap-3 md:gap-5">
            <span className="text-sm font-semibold text-zinc-300 tracking-widest uppercase opacity-80">
              Funding Rate (펀딩비)
            </span>

            <NumericAnimatedValue
              value={fundingRate}
              size="lg"
              glowMode="direction"
              format={(v) => `${(v * 100).toFixed(4)}%`}
              className="font-bold text-emerald-400 tracking-wide"
            />
          </div>

        </div>
      </div>
    </motion.div>
  )
}
