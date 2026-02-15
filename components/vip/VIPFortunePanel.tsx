'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

type FortuneResponse = {
  age: number
  zodiac: string
  chineseZodiac: string
  emotionalFlow: number
  riskTolerance: number
  focusLevel: number
  message: string
}

function Bar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-neutral-400">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-2 rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  )
}

export default function VIPFortunePanel() {
  const [birth, setBirth] = useState('')
  const [data, setData] = useState<FortuneResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const todayStr = new Date().toLocaleDateString()

  const fetchFortune = async () => {
    if (!birth) return

    setLoading(true)
    try {
      const res = await fetch(`/api/fortune?birth=${birth}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error('Fortune fetch error', e)
    }
    setLoading(false)
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">
          🔮 오늘의 전략적 운세 (Today’s Strategic Horoscope)
        </h3>
        <span className="text-xs text-neutral-500">
          {todayStr}
        </span>
      </div>

      {/* ================= INPUT ================= */}
      <div className="flex gap-2">
        <input
          type="date"
          value={birth}
          onChange={(e) => setBirth(e.target.value)}
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
        />
        <button
          onClick={fetchFortune}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg text-sm font-semibold text-white active:scale-[0.97]"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* ================= RESULT ================= */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          {/* Basic Info */}
          <div className="text-sm text-neutral-300 space-y-1">
            <div>
              Age: <strong>{data.age}</strong>
            </div>
            <div>
              Zodiac: <strong>{data.zodiac}</strong>
            </div>
            <div>
              Chinese Zodiac: <strong>{data.chineseZodiac}</strong>
            </div>
          </div>

          {/* Energy Indicators */}
          <div className="space-y-4">
            <Bar
              label="Emotional Flow"
              value={data.emotionalFlow}
              color="#a855f7"
            />
            <Bar
              label="Risk Tolerance"
              value={data.riskTolerance}
              color="#f97316"
            />
            <Bar
              label="Focus Level"
              value={data.focusLevel}
              color="#22c55e"
            />
          </div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-neutral-800/60 border border-neutral-700 rounded-lg p-4 text-sm text-neutral-200 leading-relaxed"
          >
            {data.message}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
