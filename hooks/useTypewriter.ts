'use client'

import { useEffect, useState } from 'react'
import { useSignalSound } from '@/lib/sound/useSignalSound'

/* =====================================================
   🔥 고급 타자기 효과 (속도 멀티플라이어 적용 버전)
===================================================== */

/* 🚀 전역 배속 제어 */
const SPEED_MULTIPLIER = 1.5

export function useTypewriter(
  text: string,
  speed: number = 15
) {

  const [displayed, setDisplayed] = useState('')
  const [index, setIndex] = useState(0)

  const { playTyping } = useSignalSound()

  /* 실제 적용 속도 */
  const adjustedSpeed = speed / SPEED_MULTIPLIER

  /* 🔄 텍스트 변경 시 초기화 */
  useEffect(() => {
    setDisplayed('')
    setIndex(0)
  }, [text])

  /* ⌨️ 타자기 로직 */
  useEffect(() => {

    if (!text) return
    if (index >= text.length) return

    const timeout = setTimeout(() => {

      setDisplayed(prev => prev + text[index])
      setIndex(prev => prev + 1)

      /* 🔊 타이핑 사운드 */
      playTyping()

    }, adjustedSpeed)

    return () => clearTimeout(timeout)

  }, [index, text, adjustedSpeed, playTyping])

  return displayed
}
