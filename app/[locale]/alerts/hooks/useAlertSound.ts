'use client'

import { useEffect, useRef } from 'react'

export function useAlertSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unlockedRef = useRef(false)

  useEffect(() => {
    audioRef.current = new Audio('/sounds/alert.mp3')
    audioRef.current.volume = 0.6
  }, [])

  useEffect(() => {
    // 🔓 오디오 unlock (브라우저 정책 대응)
    const unlock = () => {
      if (!audioRef.current || unlockedRef.current) return

      audioRef.current
        .play()
        .then(() => {
          audioRef.current?.pause()
          audioRef.current!.currentTime = 0
          unlockedRef.current = true
        })
        .catch(() => {})

      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }

    window.addEventListener('click', unlock)
    window.addEventListener('keydown', unlock)

    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      if (!audioRef.current || !unlockedRef.current) return

      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }

    window.addEventListener(
      'alert:triggered',
      handler as EventListener,
    )

    return () => {
      window.removeEventListener(
        'alert:triggered',
        handler as EventListener,
      )
    }
  }, [])
}
