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
          <p className="mt-1 text-sm text-gray-400">
            공지사항은 시간 제한 없이 전체 표시됩니다.
          </p>
        </div>

        {notices.length > 0 ? (
          <motion.div layout transition={CARD_TRANSITION}>
            {notices.map(item => (
              <NotificationCard
                key={item.id}
                item={item}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            layout
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={CARD_TRANSITION}
            className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-gray-400 backdrop-blur-xl"
          >
            표시할 공지사항이 없습니다.
          </motion.div>
        )}
      </div>
    </main>
  )
}
