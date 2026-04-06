'use client'

import { Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useTypewriter } from '@/hooks/useTypewriter'
import { useInterpretationTransition } from '@/hooks/useInterpretationTransition'
import { usePremiumSignalAnimation } from '@/hooks/usePremiumSignalAnimation'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

export default function LockedRiskInfo({
  signalType,
}: {
  signalType?: BollingerSignalType
}) {
  const handleUpgradeClick = () => {
    if (process.env.NODE_ENV === 'development') {
      try {} catch {}
    }

    window.location.href = '/ko/account/upgrade'
  }

  /* =========================
     🔥 Mount Trigger (핵심)
  ========================= */
  const [internalSignal, setInternalSignal] =
    useState<BollingerSignalType | undefined>(signalType)

  useEffect(() => {
    if (!signalType) {
      // mount 시 강제로 signal 변경 트리거
      setInternalSignal(BollingerSignalType.INSIDE_CENTER)

      const t = setTimeout(() => {
        setInternalSignal(
          BollingerSignalType.INSIDE_UPPER_BREAK_AND_DEVIATE
        )
      }, 50)

      return () => clearTimeout(t)
    } else {
      setInternalSignal(signalType)
    }
  }, [signalType])

  const { flash } = useInterpretationTransition(internalSignal)
  const { pulse, transition } =
    usePremiumSignalAnimation(internalSignal)

  /* =========================
     🧠 Typewriter
  ========================= */

  const mainText =
    '수익은 “이유”와 “타이밍”을 동시에 이해할 때 발생합니다'

  const descText = `펀더멘털 분석은 시장이 왜 움직이는지를 보여주며, ETF 유입, 금리, 유동성, 채택 확산 등 구조적 방향을 판단합니다. 기술적 분석은 차트와 온체인 데이터를 통해 언제 진입하고 이탈해야 하는지를 결정합니다. 한쪽만 보면 고점 진입이나 하락 추세 추종 같은 치명적 오류가 발생할 수 있습니다.`

  const footnoteText =
    '단일 지표 기반 판단은 장기적으로 일관된 수익을 보장하지 않습니다'

  const typedMain = useTypewriter(mainText)
  const isMainDone = typedMain.length >= mainText.length

  const typedDesc = useTypewriter(isMainDone ? descText : '')
  const isDescDone =
    isMainDone && typedDesc.length >= descText.length

  const typedFootnote = useTypewriter(
    isDescDone ? footnoteText : ''
  )

  return (
    <motion.div
      animate={{
        scale: transition ? 1.02 : 1,
        opacity: transition ? 0.95 : 1,
      }}
      transition={{ duration: 0.4 }}
      className={`
        pointer-events-auto
        relative z-50
        rounded-2xl
        border
        ${flash ? 'border-red-500' : 'border-vipBorder'}
        bg-black/40
        p-6
        space-y-4
        overflow-hidden
      `}
      style={{
        boxShadow: pulse
          ? '0 0 20px rgba(255,0,0,0.4), 0 0 40px rgba(255,0,0,0.25)'
          : undefined,
      }}
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
          Market Intelligence Framework
        </span>
      </div>

      {/* Main Message */}
      <div className="text-lg font-semibold text-white">
        {typedMain}
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
        {typedDesc}
      </p>

      {/* Footnote */}
      <p className="text-xs text-zinc-500">
        {typedFootnote}
      </p>
    </motion.div>
  )
}
