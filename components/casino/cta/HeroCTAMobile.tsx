// components/casino/cta/HeroCTAMobile.tsx
'use client'

import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'

export default function HeroCTAMobile({
  isLoggedIn,
  isVIP,
}: {
  isLoggedIn: boolean
  isVIP: boolean
}) {
  const router = useRouter()
  const params = useParams()

  const locale =
    typeof params?.locale === 'string' ? params.locale : 'ko'

  if (isVIP) {
    return null
  }

  const label = !isLoggedIn
    ? 'VIP 로그인하기'
    : 'VIP 권한 활성화'

  const handleClick = () => {
    if (!isLoggedIn) {
      router.push(`/${locale}/vip-login`)
      return
    }

    if (isLoggedIn && !isVIP) {
      router.push(`/${locale}/casino/vip`)
      return
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button
        onClick={handleClick}
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
      </button>
    </motion.div>
  )
}
