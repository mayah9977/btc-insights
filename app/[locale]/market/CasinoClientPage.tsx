// app/[locale]/casino/CasinoClientPage.tsx
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

import CasinoMobilePage from './CasinoMobilePage'

const CasinoDesktopPage = dynamic(
  () => import('./CasinoDesktopPage'),
  { ssr: false }
)

export default function CasinoClientPage(props: any) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)

    check()
    window.addEventListener('resize', check)

    return () => window.removeEventListener('resize', check)
  }, [])

  if (isMobile === null) return null

  if (isMobile) {
    return <CasinoMobilePage {...props} />
  }

  return <CasinoDesktopPage {...props} />
}

