'use client'

import type { ReactNode } from 'react'
import { useVIP } from '@/lib/vip/vipClient'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

export function VIP3Only({ children, fallback = null }: Props) {
  const { vipLevel } = useVIP()

  if (vipLevel !== 'VIP') {
    return <>{fallback}</>
  }

  return <>{children}</>
}
