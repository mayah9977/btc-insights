'use client'

import React, { useEffect, useState } from 'react'

interface Props {
  children: React.ReactNode
  trigger?: number | boolean
}

export default function VIPSignalCard({
  children,
  trigger
}: Props) {

  const [flash, setFlash] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {

    if (!trigger) return

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

    <div
      className={`
      relative
      rounded-xl
      border
      border-zinc-800
      bg-zinc-900
      p-4
      transition-all
      duration-500
      ${pulse ? 'scale-[1.02]' : ''}
      ${flash ? 'shadow-[0_0_25px_rgba(250,204,21,0.35)]' : ''}
      `}
    >

      {flash && (
        <div
          className="
          absolute
          inset-0
          rounded-xl
          bg-gradient-to-r
          from-transparent
          via-yellow-400/40
          to-transparent
          animate-pulse
          pointer-events-none
          "
        />
      )}

      {children}

    </div>

  )
}
