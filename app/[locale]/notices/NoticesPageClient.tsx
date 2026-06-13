//app/[locale]/notices/NoticesPageClient.tsx 

'use client'

import { useMemo } from 'react'
import type { Transition } from 'framer-motion'
import { motion } from 'framer-motion'
import type { NotificationViewItem } from '@/lib/notification/notificationStore'

type Props = {
  initialNotifications: NotificationViewItem[]
}

const EASE = [0.22, 1, 0.36, 1] as const

const CARD_TRANSITION: Transition = {
  duration: 0.24,
  ease: EASE,
}

function formatTime(ts: number) {
  const now = Date.now()
  const diff = now - ts

  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)

  if (sec < 60) return '방금 전'
  if (min < 60) return `${min}분 전`
  if (hour < 24) return `${hour}시간 전`

  const d = new Date(ts)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')

  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
}

function NotificationCard({
  item,
}: {
  item: NotificationViewItem
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={CARD_TRANSITION}
      className={`group relative mb-3 overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition ${
        item.read
          ? 'border-white/10 bg-white/[0.04]'
          : 'border-yellow-500/20 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-yellow-500/[0.06]'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-semibold text-white">
              {item.title}
            </div>
            {!item.read && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
            )}
          </div>

          <div className="mt-1 text-sm leading-relaxed text-gray-300">
            {item.body}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs text-gray-400">
            {formatTime(item.createdAt)}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-gray-500">
            {item.type}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function NoticesPageClient({
  initialNotifications,
}: Props) {
  const notices = useMemo(() => {
    return [...initialNotifications]
      .filter(item => item.type === 'NOTICE')
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [initialNotifications])

  return (
    <main className="min-h-screen bg-black px-4 py-20 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Notices</h1>
        </div>

        <motion.div
          layout
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={CARD_TRANSITION}
          className="group relative mb-6 overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.1] via-white/[0.04] to-emerald-400/[0.07] p-5 backdrop-blur-xl transition"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200">
                FIXED NOTICE
              </span>

              <div className="text-sm font-semibold text-white">
                실시간 데이터 반영 안내
              </div>
            </div>

            <div className="mt-3 text-sm leading-relaxed text-gray-300">
              시스템 특성상 VIP 페이지의 일부 수치는 데이터가 충분히 누적되거나 계산이 완료되기 전까지 일시적으로 0 또는 정상 범위와 다르게 표시될 수 있습니다. 일반적으로 1~2분 내에 정상 반영되지만, 시장 데이터 수집 상태에 따라 약 20~30분 정도 지연될 수 있습니다. 이는 실시간 데이터 누적 및 계산 과정에서 발생할 수 있는 정상적인 현상이므로 이용에 참고 부탁드립니다.
            </div>
          </div>
        </motion.div>

        {notices.length > 0 && (
          <motion.div layout transition={CARD_TRANSITION}>
            {notices.map(item => (
              <NotificationCard
                key={item.id}
                item={item}
              />
            ))}
          </motion.div>
        )}
      </div>
    </main>
  )
}
