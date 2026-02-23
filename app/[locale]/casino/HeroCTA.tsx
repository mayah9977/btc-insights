'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HeroCTA({
  isLoggedIn,
  isVIP,
  autoScale,
}: {
  isLoggedIn: boolean
  isVIP: boolean
  autoScale?: boolean
}) {
  const scaleAnim =
    autoScale
      ? { scale: [1, 1.04, 1] }
      : {}

  return (
    <motion.div
      animate={scaleAnim}
      transition={{
        duration: 1,
        repeat: autoScale ? Infinity : 0,
        repeatDelay: 2,
      }}
      className="pt-6"
    >
      {!isLoggedIn && (
        <div className="flex gap-4">
          <Link
            href="/ko/login"
            className="flex-1 rounded-2xl border border-vipBorder bg-black/40 p-6 transition"
          >
            로그인
          </Link>
          <Link
            href="/ko/account/upgrade"
            className="flex-1 rounded-2xl border border-vipBorder bg-black/40 p-6 transition"
          >
            무료 체험
          </Link>
        </div>
      )}

      {isLoggedIn && !isVIP && (
        <Link
          href="/ko/account/upgrade"
          className="block rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 to-red-500/10 p-6 transition"
        >
          VIP 업그레이드
        </Link>
      )}

      {isVIP && (
        <Link
          href="/ko/casino/vip"
          className="block rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 to-red-500/10 p-6 transition"
        >
          VIP 시스템 입장
        </Link>
      )}
    </motion.div>
  )
}