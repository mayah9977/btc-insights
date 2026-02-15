'use client'

import { useEffect, useRef, useState } from 'react'

type Options = {
  stiffness?: number   // 이동 강도
  damping?: number     // 감쇠
}

export function useRealtimeInterpolator(
  target: number,
  options: Options = {},
) {
  const {
    stiffness = 0.12,
    damping = 0.85,
  } = options

  const [value, setValue] = useState(target)
  const velocityRef = useRef(0)

  useEffect(() => {
    let frame: number

    const animate = () => {
      setValue(prev => {
        const diff = target - prev

        // 스프링 기반 이동
        velocityRef.current =
          velocityRef.current * damping +
          diff * stiffness

        const next =
          prev + velocityRef.current

        return next
      })

      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)

    return () =>
      cancelAnimationFrame(frame)
  }, [target, stiffness, damping])

  return value
}
