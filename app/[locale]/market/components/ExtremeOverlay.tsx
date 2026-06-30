'use client'

import { useVIP } from '@/lib/vip/vipClient'
import { useExtremeTheme } from '../lib/extremeThemeStore'

export default function ExtremeOverlay() {
  const { vipLevel } = useVIP()
  const { extreme } = useExtremeTheme()

  if (vipLevel !== 'VIP' || !extreme) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-black/10 to-orange-950/30" />
      <div className="absolute inset-0 animate-pulse bg-red-500/5" />
    </div>
  )
}
