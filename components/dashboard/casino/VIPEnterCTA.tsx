'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { useVipOverviewStore } from '@/lib/vip/overviewStore'

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

const phraseByRisk: Record<
  RiskLevel,
  { title: string; sub: string }
> = {
  LOW: { title: '현재 구조적 상태 검토', sub: '시장 안정 구간으로 분류되었습니다' },
  MEDIUM: { title: '구조적 압력 해석 확인', sub: '변동성 확장 가능성이 감지되었습니다' },
  HIGH: { title: '상승된 위험 구조 원인 확인', sub: '반복적 이상 신호 군집이 감지되었습니다' },
  EXTREME: { title: '이 구조 레이어는 보호 중입니다', sub: '상세 해석은 VIP 권한이 필요합니다' },
}

function borderByDwell(sec: number) {
  if (sec < 5) return 'border-vipBorder'
  if (sec < 12) return 'border-vipAccent'
  return 'border-vipDanger'
}

export default function VIPEnterCTA() {
  const router = useRouter()
  const params = useParams<{ locale?: string }>()
  const locale = params?.locale ?? 'ko'
  const { riskLevel } = useVipOverviewStore()

  const [dwell, setDwell] = useState(0)
  const [stage, setStage] = useState<'idle' | 'auth' | 'scan' | 'granted'>('idle')
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setDwell((d) => d + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('/sounds/click-soft.mp3')
    audioRef.current.volume = 0.25
  }, [])

  const phrase = phraseByRisk[riskLevel]
  const borderTone = borderByDwell(dwell)

  const handleClick = () => {
    if (stage !== 'idle') return
    audioRef.current?.play().catch(() => {})
    setStage('auth')
    setTimeout(() => setStage('scan'), 600)
    setTimeout(() => {
      setStage('granted')
      setFlash(true)
      setTimeout(() => setFlash(false), 150)
    }, 1300)
    setTimeout(() => router.push(`/${locale}/casino/vip`), 1900)
  }

  /* 🔢 랜덤 숫자 스트림 */
  const randomLines = useMemo(() => {
    return Array.from({ length: 12 }).map(() =>
      Math.random().toString(36).substring(2, 14).toUpperCase(),
    )
  }, [stage])

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
        disabled={stage !== 'idle'}
        className={`relative w-full rounded-2xl border ${borderTone}
          bg-gradient-to-r from-red-600/25 to-red-900/35
          p-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.7)]
          space-y-3 transition-colors overflow-hidden`}
      >
        <div className="text-xs tracking-widest uppercase text-red-300">
          AI Risk Briefing OS – 제한 레이어
        </div>

        <div className="text-xl font-extrabold text-white">
          {phrase.title}
        </div>

        <div className="text-sm text-zinc-300">
          {phrase.sub}
        </div>

        {dwell > 8 && (
          <div className="pt-1 text-xs text-zinc-400">
            본 브리핑은 현재 시장 상태에서만 의미를 가집니다.
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {stage !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl bg-black/90 backdrop-blur-md flex items-center justify-center z-20 overflow-hidden"
          >
            {/* ⚡ Clearance Flash */}
            {flash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white"
              />
            )}

            {/* Shockwave */}
            {stage === 'granted' && (
              <motion.div
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute w-40 h-40 rounded-full border border-emerald-400"
              />
            )}

            {/* CRT Scanlines */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background:
                  'repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 2px, transparent 4px)',
              }}
            />

            {/* Grid */}
            <motion.div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(0,255,180,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,180,0.3) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
              animate={{
                backgroundPosition:
                  stage === 'scan' ? ['0px 0px', '0px 40px'] : '0px 0px',
              }}
              transition={{ duration: 0.8, ease: 'linear' }}
            />

            {/* 🔴 Double Beam */}
            {stage === 'scan' && (
              <>
                <motion.div
                  initial={{ y: '-100%' }}
                  animate={{ y: '100%' }}
                  transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                  className="absolute left-0 right-0 h-[6px]"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent, rgba(0,255,200,0.7), transparent)',
                  }}
                />
                <motion.div
                  initial={{ y: '-120%' }}
                  animate={{ y: '100%' }}
                  transition={{ duration: 1.4, ease: 'linear', repeat: Infinity }}
                  className="absolute left-0 right-0 h-[4px]"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent, rgba(0,180,255,0.6), transparent)',
                  }}
                />
              </>
            )}

            {/* 🔢 Data Stream */}
            {stage === 'scan' && (
              <div className="absolute left-6 top-6 text-[10px] font-mono text-emerald-400 space-y-1 opacity-70">
                {randomLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}

            {/* Text */}
            <div className="relative z-10 text-center space-y-4">
              {stage === 'auth' && (
                <>
                  <div className="text-xs tracking-widest uppercase text-emerald-400">
                    ACCESS AUTHORIZATION
                  </div>
                  <div className="text-lg font-bold text-white">
                    VIP 권한 확인 중...
                  </div>
                </>
              )}

              {stage === 'scan' && (
                <>
                  <div className="text-xs tracking-widest uppercase text-cyan-400 animate-pulse">
                    SECURITY SCAN
                  </div>
                  <div className="text-lg font-bold text-white">
                    보안 스캔 진행 중...
                  </div>
                </>
              )}

              {stage === 'granted' && (
                <>
                  <div className="text-xs tracking-widest uppercase text-emerald-400">
                    CLEARANCE VERIFIED
                  </div>
                  <div className="text-lg font-bold text-white">
                    접근 권한 승인
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
