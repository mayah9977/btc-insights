// lib/market/institutional/useFinalizedSnapshotBootstrap.ts

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

type ComparableFinalizedSnapshot = {
  confirmedCandleTs?: number
  sampleCount?: number

  oiDeltaAverage?: number
  oiDeltaAccum?: number

  volumeRatioAverage?: number
  whaleIntensityAverage?: number
  whaleNetRatioAverage?: number

  fundingAverage?: number

  fmaiDirectionalPressure?: string
  oiDirectionalPressure?: string

  dominantFlow?: string
  whaleBias?: string
  volumeState?: string
  fundingState?: string

  endTs?: number
}

const FINALIZED_SNAPSHOT_REFRESH_INTERVAL_MS =
  60 * 1000

let bootstrapped = false

let finalizedSnapshotRefreshIntervalId:
  | number
  | null = null

function createSnapshotFingerprint(
  snapshot:
    | ComparableFinalizedSnapshot
    | null
    | undefined,
): string {
  if (!snapshot) {
    return ''
  }

  return [
    snapshot.confirmedCandleTs ?? '',
    snapshot.sampleCount ?? '',

    snapshot.oiDeltaAverage ?? '',
    snapshot.oiDeltaAccum ?? '',

    snapshot.volumeRatioAverage ?? '',
    snapshot.whaleIntensityAverage ?? '',
    snapshot.whaleNetRatioAverage ?? '',

    snapshot.fundingAverage ?? '',

    snapshot.fmaiDirectionalPressure ?? '',
    snapshot.oiDirectionalPressure ?? '',

    snapshot.dominantFlow ?? '',
    snapshot.whaleBias ?? '',
    snapshot.volumeState ?? '',
    snapshot.fundingState ?? '',

    snapshot.endTs ?? '',
  ].join('|')
}

function shouldApplySnapshot(
  current:
    | ComparableFinalizedSnapshot
    | null
    | undefined,
  next:
    | ComparableFinalizedSnapshot
    | null
    | undefined,
): boolean {
  if (!next) {
    return false
  }

  if (!current) {
    return true
  }

  if (
    current.confirmedCandleTs ===
      next.confirmedCandleTs &&
    (next.sampleCount ?? 0) <
      (current.sampleCount ?? 0)
  ) {
    return false
  }

  return (
    createSnapshotFingerprint(current) !==
    createSnapshotFingerprint(next)
  )
}

export function useFinalizedSnapshotBootstrap() {
  useEffect(() => {
    const current30mSnapshot =
      useInstitutionalEvidenceStore.getState().snapshot

    const current1hSnapshot =
      useInstitutionalEvidenceStore1h.getState().snapshot

    const storeHydrated =
      Boolean(current30mSnapshot) &&
      Boolean(current1hSnapshot)

    const shouldRunBootstrap =
      !bootstrapped || !storeHydrated

    if (shouldRunBootstrap) {
      bootstrapped = true
    }

    const fetchAndApplyFinalizedSnapshots = async (
      source: 'BOOTSTRAP' | 'REFRESH',
    ) => {
      try {
        if (source === 'BOOTSTRAP') {
          console.log(
            '[FINALIZED_SNAPSHOT_BOOTSTRAP_START]',
            {
              ts: Date.now(),
            },
          )
        }

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

        const current30mFingerprint =
          createSnapshotFingerprint(current30m)

        const server30mFingerprint =
          createSnapshotFingerprint(snapshot30m)

        const shouldApply30m =
          shouldApplySnapshot(
            current30m,
            snapshot30m,
          )

        if (shouldApply30m) {
          store30m.setFinalizedSnapshot(
            snapshot30m as InstitutionalEvidenceSnapshot,
          )

          if (source === 'BOOTSTRAP') {
            console.log(
              '[FINALIZED_SNAPSHOT_BOOTSTRAP_APPLIED_30M]',
              {
                ts: Date.now(),
                previousConfirmedCandleTs:
                  current30m?.confirmedCandleTs,
                newConfirmedCandleTs:
                  snapshot30m?.confirmedCandleTs,
                previousSampleCount:
                  current30m?.sampleCount,
                newSampleCount:
                  snapshot30m?.sampleCount,
                previousFingerprint:
                  current30mFingerprint,
                newFingerprint:
                  server30mFingerprint,
              },
            )
          } else {
            console.log(
              '[FINALIZED_SNAPSHOT_REFRESH_APPLIED_30M]',
              {
                ts: Date.now(),
                previousConfirmedCandleTs:
                  current30m?.confirmedCandleTs,
                newConfirmedCandleTs:
                  snapshot30m?.confirmedCandleTs,
                previousSampleCount:
                  current30m?.sampleCount,
                newSampleCount:
                  snapshot30m?.sampleCount,
                previousFingerprint:
                  current30mFingerprint,
                newFingerprint:
                  server30mFingerprint,
              },
            )
          }
        } else {
          if (source === 'BOOTSTRAP') {
            console.log(
              '[FINALIZED_SNAPSHOT_BOOTSTRAP_SKIPPED_30M]',
              {
                ts: Date.now(),
                currentConfirmedCandleTs:
                  current30m?.confirmedCandleTs,
                serverConfirmedCandleTs:
                  snapshot30m?.confirmedCandleTs,
                currentSampleCount:
                  current30m?.sampleCount,
                serverSampleCount:
                  snapshot30m?.sampleCount,
                currentFingerprint:
                  current30mFingerprint,
                serverFingerprint:
                  server30mFingerprint,
                reason:
                  snapshot30m === null
                    ? 'NO_SERVER_SNAPSHOT'
                    : 'FINGERPRINT_EQUAL_OR_LOWER_SAMPLE_COUNT',
              },
            )
          }
        }

        const store1h =
          useInstitutionalEvidenceStore1h.getState()

        const current1h =
          store1h.snapshot

        const current1hFingerprint =
          createSnapshotFingerprint(current1h)

        const server1hFingerprint =
          createSnapshotFingerprint(snapshot1h)

        if (
          shouldApplySnapshot(
            current1h,
            snapshot1h,
          )
        ) {
          store1h.setFinalizedSnapshot(
            snapshot1h as InstitutionalEvidenceSnapshot1h,
          )

          console.log(
            '[FINALIZED_SNAPSHOT_BOOTSTRAP_APPLIED_1H]',
            {
              ts: Date.now(),
              source,
              previousConfirmedCandleTs:
                current1h?.confirmedCandleTs,
              newConfirmedCandleTs:
                snapshot1h?.confirmedCandleTs,
              previousSampleCount:
                current1h?.sampleCount,
              newSampleCount:
                snapshot1h?.sampleCount,
              previousFingerprint:
                current1hFingerprint,
              newFingerprint:
                server1hFingerprint,
            },
          )
        } else if (source === 'BOOTSTRAP') {
          console.log(
            '[FINALIZED_SNAPSHOT_BOOTSTRAP_SKIPPED_1H]',
            {
              ts: Date.now(),
              source,
              currentConfirmedCandleTs:
                current1h?.confirmedCandleTs,
              serverConfirmedCandleTs:
                snapshot1h?.confirmedCandleTs,
              currentSampleCount:
                current1h?.sampleCount,
              serverSampleCount:
                snapshot1h?.sampleCount,
              currentFingerprint:
                current1hFingerprint,
              serverFingerprint:
                server1hFingerprint,
              reason:
                snapshot1h === null
                  ? 'NO_SERVER_SNAPSHOT'
                  : 'FINGERPRINT_EQUAL_OR_LOWER_SAMPLE_COUNT',
            },
          )
        }
      } catch (error) {
        console.error(
          '[FINALIZED_SNAPSHOT_BOOTSTRAP_ERROR]',
          {
            ts: Date.now(),
            source,
            error,
          },
        )
      }
    }

    if (shouldRunBootstrap) {
      void fetchAndApplyFinalizedSnapshots(
        'BOOTSTRAP',
      )
    }

    if (finalizedSnapshotRefreshIntervalId === null) {
      finalizedSnapshotRefreshIntervalId =
        window.setInterval(() => {
          void fetchAndApplyFinalizedSnapshots(
            'REFRESH',
          )
        }, FINALIZED_SNAPSHOT_REFRESH_INTERVAL_MS)
    }

    return () => {
      if (finalizedSnapshotRefreshIntervalId !== null) {
        window.clearInterval(
          finalizedSnapshotRefreshIntervalId,
        )

        finalizedSnapshotRefreshIntervalId = null
      }
    }
  }, [])
}
