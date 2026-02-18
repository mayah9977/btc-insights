'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type FortuneResponse = {
  age: number
  zodiac: string
  chineseZodiac: string
  loveLuck: number
  moneyLuck: number
  healthLuck: number
  careerLuck: number
  detailedMessage: {
    love: string
    money: string
    health: string
    career: string
  }
}

/* =========================================================
   🔥 Premium Energy Bar
========================================================= */

function Bar({
  label,
  value,
  color,
  index,
}: {
  label: string
  value: number
  color: string
  index: number
}) {
  const glow =
    value >= 80
      ? '0 0 18px rgba(255,215,0,0.8)'
      : '0 0 10px rgba(255,215,0,0.3)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.18 }}
      className="space-y-2"
    >
      <div className="flex justify-between text-sm text-neutral-300">
        <span>{label}</span>
        <span className="font-semibold text-yellow-300">{value}</span>
      </div>

      <div className="relative w-full h-3 bg-neutral-900 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="h-3 rounded-full relative"
          style={{
            background: color,
            boxShadow: glow,
          }}
        >
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: 'linear',
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function VIPFortunePanel() {
  const [birth, setBirth] = useState('')
  const [data, setData] = useState<FortuneResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  const todayStr = new Date().toLocaleDateString()

  const avgScore = useMemo(() => {
    if (!data) return 0
    return (
      (data.loveLuck +
        data.moneyLuck +
        data.healthLuck +
        data.careerLuck) /
      4
    )
  }, [data])

  const fetchFortune = async () => {
    if (!birth) return
    setLoading(true)
    try {
      const res = await fetch(`/api/fortune?birth=${birth}`)
      const json = await res.json()
      setData(json)
      setIsOpen(true)
    } catch (e) {
      console.error('Fortune fetch error', e)
    }
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="
        relative
        rounded-3xl
        p-[2px]
        bg-gradient-to-r
        from-yellow-500
        via-amber-300
        to-yellow-600
      "
    >
      <div className="relative bg-black/95 rounded-3xl p-10 overflow-hidden shadow-[0_0_60px_rgba(255,215,0,0.12)]">

        {/* GOLD AURA BACKGROUND */}
        <motion.div
          animate={{ opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255,215,0,0.25), transparent 70%)',
          }}
        />

        {/* GOLD SCAN LINE */}
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
          className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
        />

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <motion.h3
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="
              text-2xl
              font-bold
              tracking-wide
              bg-gradient-to-r
              from-yellow-300
              via-amber-400
              to-yellow-500
              bg-clip-text
              text-transparent
            "
          >
            ✨ VIP 전용 오늘의 운세 ( Fortune Intelligence )
          </motion.h3>
          <span className="text-xs text-neutral-500">{todayStr}</span>
        </div>

        {/* INPUT ZONE */}
        <div className="flex gap-4 mb-10 relative z-10">
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="date"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            className="
              flex-1
              bg-neutral-900/70
              backdrop-blur
              border border-yellow-600/40
              rounded-2xl
              px-5 py-3
              text-sm
              text-white
              focus:ring-2
              focus:ring-yellow-500/50
              transition-all
            "
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchFortune}
            disabled={loading}
            className="
              px-7 py-3
              bg-gradient-to-r
              from-yellow-500
              to-amber-400
              rounded-2xl
              text-sm
              font-bold
              text-black
              shadow-[0_0_20px_rgba(255,215,0,0.4)]
            "
          >
            {loading ? '분석 중...' : '오늘의 운세 확인하기'}
          </motion.button>
        </div>

        {!data && (
          <div className="text-center py-14 text-neutral-500 relative z-10">
            🔮 생년월일을 입력하면 VIP 운세가 시작됩니다.
          </div>
        )}

        <AnimatePresence>
          {data && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8 cursor-pointer relative z-10"
              onClick={() => setIsOpen(!isOpen)}
            >
              {/* COLLAPSED */}
              {!isOpen && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="
                    bg-neutral-900/80
                    border border-yellow-500/30
                    rounded-2xl
                    p-8
                    text-center
                  "
                >
                  <div className="text-sm text-neutral-400 mb-2">
                    오늘의 종합 점수
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 180 }}
                    className="
                      text-5xl
                      font-bold
                      text-yellow-400
                    "
                    style={{
                      textShadow:
                        '0 0 30px rgba(255,215,0,0.8)',
                    }}
                  >
                    {avgScore.toFixed(0)}
                  </motion.div>

                  <div className="text-xs text-neutral-500 mt-3">
                    (클릭하면 상세 운세 보기)
                  </div>
                </motion.div>
              )}

              {/* EXPANDED */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5 }}
                    className="overflow-hidden space-y-8"
                  >
                    <div className="text-sm text-neutral-300 space-y-1">
                      <div>나이: <strong>{data.age}</strong></div>
                      <div>별자리: <strong>{data.zodiac}</strong></div>
                      <div>띠: <strong>{data.chineseZodiac}</strong></div>
                    </div>

                    <div className="space-y-6">
                      <Bar label="애정운" value={data.loveLuck} color="#ec4899" index={0} />
                      <Bar label="금전운" value={data.moneyLuck} color="#facc15" index={1} />
                      <Bar label="건강운" value={data.healthLuck} color="#22c55e" index={2} />
                      <Bar label="커리어운" value={data.careerLuck} color="#3b82f6" index={3} />
                    </div>

                    <div className="bg-neutral-900/80 border border-yellow-500/20 rounded-2xl p-6 text-sm text-neutral-200 space-y-4">
                      <div><strong className="text-pink-400">애정운:</strong> {data.detailedMessage.love}</div>
                      <div><strong className="text-yellow-400">금전운:</strong> {data.detailedMessage.money}</div>
                      <div><strong className="text-green-400">건강운:</strong> {data.detailedMessage.health}</div>
                      <div><strong className="text-blue-400">커리어운:</strong> {data.detailedMessage.career}</div>
                    </div>

                    <div className="text-xs text-neutral-500 text-center">
                      (클릭하면 접기)
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
