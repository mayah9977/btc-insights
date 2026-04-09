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
          style={{ background: color, boxShadow: glow }}
        >
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function FortunePanel() {
  const [birth, setBirth] = useState('')
  const [data, setData] = useState<FortuneResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

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
      setModalOpen(true)
    } catch (e) {
      console.error('Fortune fetch error', e)
    }
    setLoading(false)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative rounded-3xl p-[2px] bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-600"
      >
        <div className="relative bg-black/95 rounded-3xl p-5 sm:p-6 overflow-hidden shadow-[0_0_60px_rgba(255,215,0,0.12)]">
          <motion.div
            animate={{ opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at center, rgba(255,215,0,0.25), transparent 70%)',
            }}
          />

          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
          />

          <div className="flex justify-between items-center mb-6 relative z-10">
            <motion.h3
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-lg sm:text-2xl font-bold tracking-wide bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent"
            >
              ✨ VIP 전용 오늘의 운세 ( Fortune Intelligence )
            </motion.h3>
          </div>

          <div className="flex flex-col gap-3 mb-6 relative z-10">
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="date"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              className="w-full bg-neutral-900/70 backdrop-blur border border-yellow-600/40 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-yellow-500/50 transition-all"
            />

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={fetchFortune}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-400 rounded-2xl text-sm font-bold text-black"
            >
              {loading ? '분석 중...' : '오늘의 운세 확인하기'}
            </motion.button>
          </div>

          {!data && (
            <div className="text-center py-10 text-neutral-500 relative z-10">
              🔮 생년월일을 입력하면 VIP 운세가 시작됩니다.
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {modalOpen && data && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setModalOpen(false)}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-black rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-4" />

              <div className="space-y-6">
                <div className="text-sm text-neutral-300 space-y-1">
                  <div>나이: {data.age}</div>
                  <div>별자리: {data.zodiac}</div>
                  <div>띠: {data.chineseZodiac}</div>
                </div>

                <Bar label="애정운" value={data.loveLuck} color="#ec4899" index={0} />
                <Bar label="금전운" value={data.moneyLuck} color="#facc15" index={1} />
                <Bar label="건강운" value={data.healthLuck} color="#22c55e" index={2} />
                <Bar label="커리어운" value={data.careerLuck} color="#3b82f6" index={3} />

                <div className="text-sm text-neutral-200 space-y-2">
                  <div>💖 {data.detailedMessage.love}</div>
                  <div>💰 {data.detailedMessage.money}</div>
                  <div>🧘 {data.detailedMessage.health}</div>
                  <div>🚀 {data.detailedMessage.career}</div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
