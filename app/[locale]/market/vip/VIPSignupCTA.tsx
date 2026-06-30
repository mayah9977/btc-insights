//app/[locale]/market/vip/VIPSignupCTA.tsx  

'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function VIPSignupCTA({ locale }: { locale: string }) {
  const router = useRouter()

  return (
    <motion.button
      onClick={() => router.push(`/${locale}/market/vip/signup`)}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.96 }}
      className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-bold shadow-lg"
    >
      결제하기
    </motion.button>
  )
}
