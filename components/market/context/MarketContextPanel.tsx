'use client'

import { useEffect, useState, useRef } from 'react'
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

  const prevUpdatedAtRef = useRef<number | null>(null)
  const [showFlash, setShowFlash] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchContext = async () => {
      try {
        const res = await fetch('/api/market/context', {
          cache: 'no-store',
        })

        if (!res.ok) {
          if (isMounted) setLoading(false)
          return
        }

        const json = await res.json()

        if (!json?.ok || !json?.data || !isMounted) {
          if (isMounted) setLoading(false)
          return
        }

        const newData: MarketContextData = json.data

        setData((prev) => {
          const isValid =
            newData.summary &&
            newData.summary.trim().length > 20 &&
            newData.midLongTerm &&
            newData.midLongTerm.trim().length > 20 &&
            newData.translatedHeadlines &&
            newData.translatedHeadlines.length > 0

          if (!isValid) {
            console.warn(
              '[MarketContextPanel] Invalid new data → keeping previous'
            )
            return prev
          }

          if (!prev || prev.updatedAt !== newData.updatedAt) {

            if (
              prev &&
              prevUpdatedAtRef.current &&
              prevUpdatedAtRef.current !== newData.updatedAt
            ) {
              setShowFlash(true)
              setShowToast(true)

              setTimeout(() => setShowFlash(false), 1200)
              setTimeout(() => setShowToast(false), 4000)
            }

            prevUpdatedAtRef.current = newData.updatedAt
            return newData
          }

          return prev
        })
      } catch (error) {
        console.error('[MarketContextPanel] fetch error:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchContext()

    const interval = setInterval(() => {
      fetchContext()
    }, 1000 * 60 * 45)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border border-yellow-500/20 bg-black/50 p-6 text-sm text-gray-400">
        📰 VIP Market Context 로딩 중...
      </section>
    )
  }

  if (!data) {
    return (
      <section className="mt-8 rounded-2xl border border-gray-800 bg-black/40 p-6 text-sm text-gray-500">
        📰 현재 새로운 시장정보를 기다리고 있습니다.
      </section>
    )
  }

  const updatedDate = new Date(data.updatedAt)
  const timeLabel = `${updatedDate.toLocaleDateString()} ${updatedDate.toLocaleTimeString()}`

  return (
    <>
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="
              fixed top-6 left-1/2 -translate-x-1/2 z-50
              px-6 py-3 rounded-full
              bg-gradient-to-r from-yellow-500 to-amber-400
              text-black text-sm font-semibold
              shadow-2xl
            "
          >
            ✨ 새 시장 정보 도착
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.section
          key={data.updatedAt}
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.9 }}
          className="
            relative mt-8 overflow-hidden
            rounded-3xl
            border border-yellow-500/20
            bg-gradient-to-b from-black via-zinc-900 to-black
            p-5 md:p-8
            shadow-[0_30px_100px_rgba(0,0,0,0.8)]
          "
        >

          <AnimatePresence>
            {showFlash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 rounded-3xl pointer-events-none bg-yellow-400/20"
              />
            )}
          </AnimatePresence>

          {/* HEADER */}

          <div className="space-y-1">

            <div className="flex items-center gap-2">
              <span className="text-lg">📰</span>

              <h3 className="text-base md:text-xl font-bold tracking-wide text-yellow-400">
                오늘의 주요뉴스와 전망
              </h3>
            </div>

            <div className="text-xs text-yellow-500/70">
              Updated {timeLabel}
            </div>

          </div>

          {/* HEADLINES */}

          <div className="space-y-4 text-sm mt-6">
            <h4 className="font-semibold text-yellow-300">
              🔹 Latest Headlines
            </h4>

            <ul className="space-y-3 text-gray-300">
              {(data.translatedHeadlines ?? []).map((title, idx) => (
                <li
                  key={`${data.updatedAt}-${idx}`}
                  className="hover:text-yellow-400 transition-all duration-300"
                >
                  • {title}
                </li>
              ))}
            </ul>
          </div>

          {/* SUMMARY */}

          <div className="space-y-3 text-sm mt-6">
            <h4 className="font-semibold text-yellow-300">
              🔎 시장 요약
            </h4>

            <p className="whitespace-pre-line leading-relaxed text-gray-300">
              {data.summary}
            </p>
          </div>

          {/* MID LONG TERM */}

          <div className="space-y-3 text-sm mt-6">
            <h4 className="font-semibold text-yellow-300">
              🧭 중장기 해석
            </h4>

            <p className="whitespace-pre-line leading-relaxed text-gray-300">
              {data.midLongTerm}
            </p>
          </div>

        </motion.section>
      </AnimatePresence>
    </>
  )
}
