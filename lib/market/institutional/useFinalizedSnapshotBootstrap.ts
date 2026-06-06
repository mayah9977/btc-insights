//lib/market/institutional/useFinalizedSnapshotBootstrap.ts  

'use client'

import { useEffect } from 'react'

import {
  useInstitutionalEvidenceStore,
} from '@/lib/market/institutional/institutionalEvidenceStore'

import {
  useInstitutionalEvidenceStore1h,
} from '@/lib/market/institutional/institutionalEvidenceStore1h'

import type {
  InstitutionalEvidenceSnapshot,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot'

import type {
  InstitutionalEvidenceSnapshot1h,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot1h'

type FinalizedSnapshotApiResponse = {
  ok: boolean
  snapshot30m:
    | InstitutionalEvidenceSnapshot
    | null
  snapshot1h:
    | InstitutionalEvidenceSnapshot1h
    | null
  ts: number
}

let bootstrapped = false

function shouldApplySnapshot(
  current:
    | {
        confirmedCandleTs: number
      }
    | null
    | undefined,
  next:
    | {
        confirmedCandleTs: number
      }
    | null
    | undefined,
): boolean {
  if (!next) {
    return false
  }

  if (!current) {
    return true
  }

  return (
    next.confirmedCandleTs >
    current.confirmedCandleTs
  )
}

export function useFinalizedSnapshotBootstrap() {
  useEffect(() => {
    if (bootstrapped) {
      return
    }

    bootstrapped = true

    const bootstrap = async () => {
      try {
        console.log(
          '[FINALIZED_SNAPSHOT_BOOTSTRAP_START]',
          {
            ts: Date.now(),
          },
        )

        const response = await fetch(
          '/api/institutional/finalized',
          {
            method: 'GET',
            cache: 'no-store',
          },
        )

        if (!response.ok) {
          throw new Error(
            `finalized snapshot bootstrap failed: ${response.status}`,
          )
        }

        const data =
          (await response.json()) as FinalizedSnapshotApiResponse

        const snapshot30m =
          data?.snapshot30m ?? null

        const snapshot1h =
          data?.snapshot1h ?? null

        const store30m =
          useInstitutionalEvidenceStore.getState()

        const current30m =
          store30m.snapshot

        if (
          shouldApplySnapshot(
            current30m,
            snapshot30m,
          )
        ) {
          store30m.setSnapshot(
            snapshot30m as InstitutionalEvidenceSnapshot,
          )

          console.log(
            '[FINALIZED_SNAPSHOT_BOOTSTRAP_APPLIED_30M]',
            {
              ts: Date.now(),
              previousConfirmedCandleTs:
                current30m?.confirmedCandleTs,
              newConfirmedCandleTs:
                snapshot30m?.confirmedCandleTs,
              sampleCount:
                snapshot30m?.sampleCount,
            },
          )
        } else {
          console.log(
            '[FINALIZED_SNAPSHOT_BOOTSTRAP_SKIPPED_30M]',
            {
              ts: Date.now(),
              currentConfirmedCandleTs:
                current30m?.confirmedCandleTs,
              serverConfirmedCandleTs:
                snapshot30m?.confirmedCandleTs,
              reason:
                snapshot30m === null
                  ? 'NO_SERVER_SNAPSHOT'
                  : 'CURRENT_IS_NEWER_OR_EQUAL',
            },
          )
        }

        const store1h =
          useInstitutionalEvidenceStore1h.getState()

        const current1h =
          store1h.snapshot

        if (
          shouldApplySnapshot(
            current1h,
            snapshot1h,
          )
        ) {
          store1h.setSnapshot(
            snapshot1h as InstitutionalEvidenceSnapshot1h,
          )

          console.log(
            '[FINALIZED_SNAPSHOT_BOOTSTRAP_APPLIED_1H]',
            {
              ts: Date.now(),
              previousConfirmedCandleTs:
                current1h?.confirmedCandleTs,
              newConfirmedCandleTs:
                snapshot1h?.confirmedCandleTs,
              sampleCount:
                snapshot1h?.sampleCount,
            },
          )
        } else {
          console.log(
            '[FINALIZED_SNAPSHOT_BOOTSTRAP_SKIPPED_1H]',
            {
              ts: Date.now(),
              currentConfirmedCandleTs:
                current1h?.confirmedCandleTs,
              serverConfirmedCandleTs:
                snapshot1h?.confirmedCandleTs,
              reason:
                snapshot1h === null
                  ? 'NO_SERVER_SNAPSHOT'
                  : 'CURRENT_IS_NEWER_OR_EQUAL',
            },
          )
        }
      } catch (error) {
        console.error(
          '[FINALIZED_SNAPSHOT_BOOTSTRAP_ERROR]',
          {
            ts: Date.now(),
            error,
          },
        )
      }
    }

    void bootstrap()
  }, [])
}
