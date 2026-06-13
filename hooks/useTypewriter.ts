// hooks/useTypewriter.ts

'use client'

import { useEffect, useState } from 'react'
import { vipSound } from '@/lib/sound/vipSoundSystem'

/* ======================================================================
   🔥 Advanced typewriter effect (version with speed multiplier)
===================================================================== */

/* 🚀 Global speed control */
const SPEED_MULTIPLIER = 1.5

const completedTextCache = new Set<string>()

export function useTypewriter(
  text: string,
  speed: number = 15
) {
  const [displayed, setDisplayed] = useState('')
  const [index, setIndex] = useState(0)

  /* Actual application speed */
  const adjustedSpeed = speed / SPEED_MULTIPLIER

  /* 🔄 Reset when text changes */
  useEffect(() => {
    if (!text) {
      setDisplayed('')
      setIndex(0)
      return
    }

    if (completedTextCache.has(text)) {
      setDisplayed(text)
      setIndex(text.length)
      return
    }

    setDisplayed('')
    setIndex(0)
  }, [text])

  /* ⌨️ Typewriter logic */
  useEffect(() => {
    if (!text) return

    if (completedTextCache.has(text)) {
      return
    }

    if (index >= text.length) {
      if (!completedTextCache.has(text)) {
        completedTextCache.add(text)
      }

      return
    }

    const timeout = setTimeout(() => {
      setDisplayed((prev) => prev + text[index])
      setIndex((prev) => prev + 1)

      /* 🔊 Typing sound */
      if (index % 2 === 0) {
        vipSound.play('typing')
      }
    }, adjustedSpeed)

    return () => clearTimeout(timeout)
  }, [index, text, adjustedSpeed])

  return displayed
}
