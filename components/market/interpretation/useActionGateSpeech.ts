'use client'

import { useEffect, useRef, useState } from 'react'
import { ActionGateState } from '@/components/system/ActionGateStatus'

/**
 * Action Gate Speech Stabilizer (UX)
 *
 * 역할:
 * - ActionGateState 변화 기반 문장 출력 제어
 * - 동일 상태 반복 시 문장 유지
 * - 과도한 문장 갱신 방지
 *
 * 원칙:
 * - ❌ 판단 / 계산 없음
 * - ❌ 상태 생성 없음
 * - ⭕ UX 안정화만 담당
 */

type SpeechState = {
  gate: ActionGateState
  at: number
}

const MIN_HOLD_MS = 15_000 // 최소 문장 유지 시간

export function useActionGateSpeech(gate: ActionGateState) {
  const [activeGate, setActiveGate] = useState<ActionGateState>(gate)

  const last = useRef<SpeechState>({
    gate,
    at: Date.now(),
  })

  useEffect(() => {
    const now = Date.now()

    // IGNORE는 항상 즉시 반영 (문장 숨김)
    if (gate === 'IGNORE') {
      last.current = { gate, at: now }
      setActiveGate(gate)
      return
    }

    // 상태 변화 없음 → 유지
    if (gate === last.current.gate) return

    // 최소 유지 시간 미충족 → 무시
    if (now - last.current.at < MIN_HOLD_MS) return

    // 상태 변경 허용
    last.current = { gate, at: now }
    setActiveGate(gate)
  }, [gate])

  return activeGate
}
