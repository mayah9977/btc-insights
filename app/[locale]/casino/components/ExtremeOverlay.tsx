'use client'

import { useVIP } from '@/lib/vip/vipClient'
import { useExtremeTheme } from '../lib/extremeThemeStore'

export default function ExtremeOverlay() {
  const { vipLevel } = useVIP()
  const { extreme } = useExtremeTheme()

  if (vipLevel !== 'VIP3' || !extreme) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-red-900/30 animate-pulse" />
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-6xl font-extrabold text-red-500 drop-shadow-lg">
          EXTREME
        </h1>
      </div>
    </div>
  )
}
