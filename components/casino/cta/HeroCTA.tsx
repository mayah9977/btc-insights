// components/casino/cta/HeroCTA.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'

export default function HeroCTA({
  isLoggedIn,
  isVIP,
  autoScale,
}: {
  isLoggedIn: boolean
  isVIP: boolean
  autoScale?: boolean
}) {
  const params = useParams()
  const locale =
    typeof params?.locale === 'string' ? params.locale : 'ko'

  const scaleAnim = autoScale ? { scale: [1, 1.04, 1] } : {}

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
        <div className="flex flex-col md:flex-row gap-4">
          <Link
            href={`/${locale}/vip-login`}
            className="w-full rounded-2xl border border-vipBorder bg-black/40 p-6 transition hover:border-zinc-400"
          >
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              Authentication Required
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              Access Login Portal
            </div>
          </Link>

          <Link
            href={`/${locale}/casino/vip`}
            className="w-full rounded-2xl border border-vipBorder bg-black/40 p-6 transition hover:border-yellow-400"
          >
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              Access Elevation
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              Request VIP Clearance
            </div>
          </Link>
        </div>
      )}

      {isLoggedIn && !isVIP && (
        <Link
          href={`/${locale}/casino/vip`}
          className="block w-full rounded-2xl border border-yellow-500/40
          bg-gradient-to-br from-yellow-500/10 to-red-500/10
          p-6 transition hover:scale-[1.02]"
        >
          <div className="text-xs uppercase tracking-widest text-yellow-300">
            Access Level: Restricted
          </div>
          <div className="mt-2 text-xl font-semibold text-white">
            Elevate to VIP Risk Briefing Access
          </div>
        </Link>
      )}

      {isVIP && (
        <Link
          href={`/${locale}/casino/vip`}
          className="block w-full rounded-2xl border border-yellow-500/40
          bg-gradient-to-br from-yellow-500/10 to-red-500/10
          p-6 transition hover:scale-[1.02]"
        >
          <div className="text-xs uppercase tracking-widest text-yellow-300">
            Clearance Verified
          </div>
          <div className="mt-2 text-xl font-semibold text-white">
            VIP ENTER →
          </div>
        </Link>
      )}
    </motion.div>
  )
}
