'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

import VIPMobilePage from '@/components/vip/mobile/VIPMobilePage'

type Props = {
  userId: string
  weeklySummary: any
  monthlySummary: any
  vip3Metrics: any
}

/* Desktop page dynamic import (bundle 분리) */
const VIPDesktopPage = dynamic<Props>(
  () =>
    import('./desktop/VIPDesktopPage').then(
      (mod) => mod.default
    ),
  { ssr: false }
)

export default function VIPClientPage(props: Props) {

  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)

    check()

    window.addEventListener('resize', check)

    return () => window.removeEventListener('resize', check)
  }, [])

  if (isMobile === null) return null

  /* MOBILE */
  if (isMobile) {
    return <VIPMobilePage {...props} />
  }

  /* DESKTOP */
  return <VIPDesktopPage {...props} />
}
