'use client'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

export type InstitutionalDirection =
  | 'LONG'
  | 'SHORT'
  | 'NONE'

interface Input {
  rawDominant: InstitutionalDirection
  rawConfidence: number
}

/* ===========================================================
   🎯 Institutional Conviction Consistency Filter

   1️⃣ Hysteresis
   2️⃣ Confirm Duration
   3️⃣ Temporal Consistency Validation
=========================================================== */

export function useConfirmedInstitutionalSignal({
  rawDominant,
  rawConfidence,
}: Input) {

  /* =======================================================
     Thresholds
  ======================================================= */

  const ENTER_THRESHOLD = 40
  const HOLD_THRESHOLD = 30
  const EXIT_THRESHOLD = 20

  const CONFIRM_DURATION = 3000

  /* =======================================================
     State
  ======================================================= */

  const [
    confirmedDominant,
    setConfirmedDominant,
  ] =
    useState<InstitutionalDirection>(
      'NONE',
    )

  const [
    confirmedConfidence,
    setConfirmedConfidence,
  ] = useState<number>(0)

  const pendingRef =
    useRef<InstitutionalDirection>(
      'NONE',
    )

  const pendingStartTimeRef =
    useRef<number | null>(null)

  const lastConfirmedRef =
    useRef<InstitutionalDirection>(
      'NONE',
    )

  /* =======================================================
     Temporal Consistency Engine
  ======================================================= */

  useEffect(() => {

    const now = Date.now()

    const lastConfirmed =
      lastConfirmedRef.current

    /* ===================================================
       HOLD STATE
    =================================================== */

    if (lastConfirmed !== 'NONE') {

      if (
        rawConfidence >=
        HOLD_THRESHOLD
      ) {

        setConfirmedConfidence(
          rawConfidence,
        )

        return
      }

      /* ===============================================
         EXIT
      =============================================== */

      if (
        rawConfidence <
        EXIT_THRESHOLD
      ) {

        lastConfirmedRef.current =
          'NONE'

        setConfirmedDominant(
          'NONE',
        )

        setConfirmedConfidence(
          rawConfidence,
        )

        pendingRef.current =
          'NONE'

        pendingStartTimeRef.current =
          null

        return
      }
    }

    /* ===================================================
       NEW CONVICTION ENTRY
    =================================================== */

    if (
      rawDominant !== 'NONE' &&
      rawConfidence >=
        ENTER_THRESHOLD
    ) {

      /* ===============================================
         Pending Start
      =============================================== */

      if (
        pendingRef.current !==
        rawDominant
      ) {

        pendingRef.current =
          rawDominant

        pendingStartTimeRef.current =
          now

        return
      }

      /* ===============================================
         Confirm Duration
      =============================================== */

      if (
        pendingStartTimeRef.current &&
        now -
          pendingStartTimeRef.current >=
          CONFIRM_DURATION
      ) {

        lastConfirmedRef.current =
          rawDominant

        setConfirmedDominant(
          rawDominant,
        )

        setConfirmedConfidence(
          rawConfidence,
        )

        pendingRef.current =
          'NONE'

        pendingStartTimeRef.current =
          null
      }

      return
    }

    /* ===================================================
       Reset Pending
    =================================================== */

    pendingRef.current = 'NONE'

    pendingStartTimeRef.current =
      null

  }, [
    rawDominant,
    rawConfidence,
  ])

  /* =======================================================
     Return
  ======================================================= */

  return {
    confirmedDominant,
    confirmedConfidence,
    isPending:
      pendingRef.current !== 'NONE',
  }
}
