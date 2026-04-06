'use client'

import { useEffect, useState } from 'react'
import HeroDesktop from './HeroDesktop'
import HeroMobile from './HeroMobile'

type Props = {
  isLoggedIn: boolean
  isVIP: boolean
}

export default function HeroSection(props: Props) {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)

    check()

    window.addEventListener('resize', check)

    return () => window.removeEventListener('resize', check)
  }, [])

  // 👉 초기 렌더 fallback (UX 개선)
  if (typeof window === 'undefined') {
    return <HeroDesktop {...props} />
  }

  return isMobile
    ? <HeroMobile {...props} />
    : <HeroDesktop {...props} />
}
