'use client'

import { useEffect, useRef, useState } from 'react'

export type InstitutionalDirection =
  | 'LONG'
  | 'SHORT'
  | 'NONE'

interface Input {
  rawDominant: InstitutionalDirection
  rawConfidence: number
}

/*
===========================================================
🎯 기능
1️⃣ 히스테리시스 적용
2️⃣ 3초 유지 확정
3️⃣ Raw 신호와 Confirmed 신호 분리
===========================================================
*/

export function useConfirmedInstitutionalSignal({
  rawDominant,
  rawConfidence,
}: Input) {

  /* =======================================================
     🔥 히스테리시스 기준값
  ======================================================= */

  const ENTER_THRESHOLD = 40   // 진입
  const HOLD_THRESHOLD = 30    // 유지
  const EXIT_THRESHOLD = 20    // 완전 해제

  const CONFIRM_DURATION = 3000 // 3초 유지

  /* =======================================================
     상태 관리
  ======================================================= */

  const [confirmedDominant, setConfirmedDominant] =
    useState<InstitutionalDirection>('NONE')

  const [confirmedConfidence, setConfirmedConfidence] =
    useState<number>(0)

  const pendingRef = useRef<InstitutionalDirection>('NONE')
  const pendingStartTimeRef = useRef<number | null>(null)

  const lastConfirmedRef =
    useRef<InstitutionalDirection>('NONE')

  /* =======================================================
     메인 로직
  ======================================================= */

  useEffect(() => {
    const now = Date.now()
    const lastConfirmed = lastConfirmedRef.current

    /* ===============================
       1️⃣ 현재 확정 상태 유지 조건
    =============================== */

    if (lastConfirmed !== 'NONE') {
      if (rawConfidence >= HOLD_THRESHOLD) {
        // 유지 조건 충족 → 그대로 유지
        setConfirmedConfidence(rawConfidence)
        return
      }

      if (rawConfidence < EXIT_THRESHOLD) {
        // 완전 해제
        lastConfirmedRef.current = 'NONE'
        setConfirmedDominant('NONE')
        setConfirmedConfidence(rawConfidence)
        pendingRef.current = 'NONE'
        pendingStartTimeRef.current = null
        return
      }
    }

    /* ===============================
       2️⃣ 새 신호 진입 조건 검사
    =============================== */

    if (
      rawDominant !== 'NONE' &&
      rawConfidence >= ENTER_THRESHOLD
    ) {
      // pending 시작
      if (pendingRef.current !== rawDominant) {
        pendingRef.current = rawDominant
        pendingStartTimeRef.current = now
        return
      }

      // 같은 신호 유지 중이면 시간 체크
      if (
        pendingStartTimeRef.current &&
        now - pendingStartTimeRef.current >=
          CONFIRM_DURATION
      ) {
        // 🔥 확정 승격
        lastConfirmedRef.current = rawDominant
        setConfirmedDominant(rawDominant)
        setConfirmedConfidence(rawConfidence)

        pendingRef.current = 'NONE'
        pendingStartTimeRef.current = null
      }

      return
    }

    /* ===============================
       3️⃣ 진입 조건 미충족 시 pending 초기화
    =============================== */

    pendingRef.current = 'NONE'
    pendingStartTimeRef.current = null

  }, [rawDominant, rawConfidence])

  /* =======================================================
     반환값
  ======================================================= */

  return {
    confirmedDominant,
    confirmedConfidence,
    isPending: pendingRef.current !== 'NONE',
  }
}
