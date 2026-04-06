'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HeroCTAMobile({
  isLoggedIn,
  isVIP,
}: {
  isLoggedIn: boolean
  isVIP: boolean
}) {
  let href = '/ko/login'
  let label = '로그인 후 계속하기'

  if (isLoggedIn && !isVIP) {
    href = '/ko/account/upgrade'
    label = 'VIP 권한 활성화'
  }

  if (isVIP) {
    href = '/ko/casino/vip'
    label = 'VIP 브리핑 입장'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        href={href}
        className="
          block w-full text-center
          h-[56px] leading-[56px]
          rounded-xl
          text-sm font-semibold text-white
          bg-gradient-to-r from-yellow-500 to-red-500
          active:scale-[0.98]
          transition-transform
        "
      >
        {label}
      </Link>
    </motion.div>
  )
}
