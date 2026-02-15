'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MarketContextData {
  translatedHeadlines?: string[]
  summary: string
  midLongTerm: string
  updatedAt: number
}

export function MarketContextPanel() {
  const [data, setData] = useState<MarketContextData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const res = await fetch('/api/market/context', {
          cache: 'no-store',
        })

        if (!res.ok) {
          setLoading(false)
          return
        }

        const json = await res.json()

        if (json?.ok && json?.data) {
          setData(json.data)
        }
      } catch (error) {
        console.error('[MarketContextPanel] fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContext()
  }, [])

  if (loading) {
    return (
      <section className="mt-8 rounded-xl border border-gray-800 bg-black/40 p-4 text-sm text-gray-400">
        📰 Market Context 불러오는 중...
      </section>
    )
  }

  if (!data) {
    return (
      <section className="mt-8 rounded-xl border border-gray-800 bg-black/40 p-4 text-sm text-gray-500">
        📰 현재 시장 맥락 정보가 없습니다.
      </section>
    )
  }

  const updatedDate = new Date(data.updatedAt)
  const timeLabel = `${updatedDate.toLocaleDateString()} ${updatedDate.toLocaleTimeString()}`

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={data.updatedAt} // 🔥 이게 핵심
        initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="
          mt-8 space-y-6 rounded-2xl border border-gray-800
          bg-gradient-to-b from-black/70 to-black/40
          p-8 shadow-[0_25px_80px_rgba(0,0,0,0.65)]
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-wide">
            📰 오늘의 주요뉴스와 전망
          </h3>

          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="text-xs text-gray-500"
          >
            Updated: {timeLabel}
          </motion.span>
        </div>

        {/* Headlines */}
        <div className="space-y-3 text-sm">
          <h4 className="font-semibold text-gray-300">
            🔹 Latest Headlines
          </h4>

          <ul className="space-y-2 text-gray-400">
            {(data.translatedHeadlines ?? []).map((title, idx) => (
              <motion.li
                key={`${data.updatedAt}-${idx}`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.12 }}
                className="hover:text-white transition-colors duration-300"
              >
                • {title}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-2 text-sm"
        >
          <h4 className="font-semibold text-gray-300">
            🔎 시장 요약
          </h4>

          <p className="whitespace-pre-line text-gray-400 leading-relaxed">
            {data.summary}
          </p>
        </motion.div>

        {/* Mid/Long */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-2 text-sm"
        >
          <h4 className="font-semibold text-gray-300">
            🧭 중장기 해석
          </h4>

          <p className="whitespace-pre-line text-gray-400 leading-relaxed">
            {data.midLongTerm}
          </p>
        </motion.div>
      </motion.section>
    </AnimatePresence>
  )
}
