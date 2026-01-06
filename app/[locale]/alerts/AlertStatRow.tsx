'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

/* =========================
 * 타입
 * ========================= */
export type RowStatus = 'safe' | 'warning' | 'danger'

export interface AlertStatRowProps {
  label: string
  value: number | string
  highlight?: boolean

  // STEP 7-11: Threshold 기반 위험 판별
  warningThreshold?: number
  dangerThreshold?: number
}

/* =========================
 * 컴포넌트
 * ========================= */
export default function AlertStatRow({
  label,
  value,
  highlight = false,
  warningThreshold,
  dangerThreshold,
}: AlertStatRowProps) {
  const prevValue = useRef<number | null>(null)

  const [displayValue, setDisplayValue] = useState<number | string>(value)
  const [animate, setAnimate] = useState<'up' | 'down' | null>(null)

  const numericValue =
    typeof value === 'number' ? value : Number(value) || null

  /* =========================
   * Threshold 기반 상태 판별
   * ========================= */
  const status: RowStatus =
    numericValue !== null &&
    dangerThreshold !== undefined &&
    numericValue >= dangerThreshold
      ? 'danger'
      : numericValue !== null &&
        warningThreshold !== undefined &&
        numericValue >= warningThreshold
      ? 'warning'
      : 'safe'

  /* =========================
   * 값 변화 감지 + 애니메이션
   * ========================= */
  useEffect(() => {
    if (numericValue === null) {
      setDisplayValue(value)
      return
    }

    if (prevValue.current === null) {
      prevValue.current = numericValue
      setDisplayValue(numericValue)
      return
    }

    if (numericValue > prevValue.current) {
      setAnimate('up')
      countUp(prevValue.current, numericValue)
    } else if (numericValue < prevValue.current) {
      setAnimate('down')
      setDisplayValue(numericValue)
    }

    prevValue.current = numericValue

    const t = setTimeout(() => setAnimate(null), 600)
    return () => clearTimeout(t)
  }, [numericValue, value])

  /* =========================
   * Count-up 애니메이션
   * ========================= */
  const countUp = (from: number, to: number) => {
    let current = from
    const step = Math.max(1, Math.ceil((to - from) / 12))

    const interval = setInterval(() => {
      current += step
      if (current >= to) {
        current = to
        clearInterval(interval)
      }
      setDisplayValue(current)
    }, 30)
  }

  /* =========================
   * 상태별 스타일
   * ========================= */
  const statusStyle: Record<RowStatus, string> = {
    safe: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-900 animate-pulse',
    danger:
      'bg-red-100 text-red-900 shadow-[0_0_16px_rgba(239,68,68,0.8)] animate-glow',
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-between rounded-xl px-4 py-2 text-sm font-bold transition-all',
        statusStyle[status],
        highlight && 'ring-2 ring-black/20',
        animate === 'down' && 'animate-[shake_0.35s_ease-in-out]'
      )}
    >
      <span>{label}</span>
      <span className="tabular-nums">{displayValue}</span>
    </div>
  )
}
