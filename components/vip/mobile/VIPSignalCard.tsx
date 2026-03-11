'use client'

import React, { useEffect, useState } from 'react'

interface Props {
  children: React.ReactNode
  trigger?: number | boolean
}

/*
=========================================================
 VIP Signal Card Animation Wrapper
---------------------------------------------------------
 적용 효과
 1️⃣ Flash Glow
 2️⃣ Pulse
 3️⃣ Scale Boost
 4️⃣ Premium Shadow

 모바일 성능 고려
  - framer-motion 미사용
  - Tailwind animation만 사용
=========================================================
*/

export default function VIPSignalCard({
  children,
  trigger
}: Props) {

  const [flash, setFlash] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {

    if (!trigger) return

    /* Flash effect */
    setFlash(true)
    setPulse(true)

    const t1 = setTimeout(() => {
      setFlash(false)
    }, 700)

    const t2 = setTimeout(() => {
      setPulse(false)
    }, 1200)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }

  }, [trigger])

  return (

    <div className="relative">

      {/* Flash Glow Layer */}

      {flash && (
        <div
          className="
          absolute
          inset-0
          rounded-xl
          bg-gradient-to-r
          from-transparent
          via-yellow-500/20
          to-transparent
          animate-pulse
          pointer-events-none
          "
        />
      )}

      {/* Card */}

      <div
        className={`
        transition-all
        duration-500
        ${pulse ? 'scale-[1.02]' : ''}
        ${flash ? 'shadow-[0_0_25px_rgba(250,204,21,0.35)]' : ''}
        `}
      >
        {children}
      </div>

    </div>

  )
}
