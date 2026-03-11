'use client'

import { useRef } from 'react'

export function useSignalSound() {

  const typingRef = useRef<HTMLAudioElement | null>(null)
  const signalRef = useRef<HTMLAudioElement | null>(null)

  const playTyping = () => {
    if (!typingRef.current) {
      typingRef.current = new Audio('/sounds/typing.mp3')
    }

    typingRef.current.currentTime = 0
    typingRef.current.play().catch(() => {})
  }

  const playSignal = () => {
    if (!signalRef.current) {
      signalRef.current = new Audio('/sounds/signal.mp3')
    }

    signalRef.current.currentTime = 0
    signalRef.current.play().catch(() => {})
  }

  return { playTyping, playSignal }
}
