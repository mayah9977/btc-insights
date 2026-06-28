// lib/market/institutional/server/finalizedSnapshotRepository.ts

import { redis } from '@/lib/redis/server'

import type {
  InstitutionalEvidenceSnapshot,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot'

import type {
  InstitutionalEvidenceSnapshot1h,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot1h'

const FINALIZED_SNAPSHOT_30M_KEY =
  'institutional:finalized:30m:BTCUSDT'

const FINALIZED_SNAPSHOT_1H_KEY =
  'institutional:finalized:1h:BTCUSDT'

type FinalizedSnapshot =
  | InstitutionalEvidenceSnapshot
  | InstitutionalEvidenceSnapshot1h

function isZeroLikeFinalizedSnapshot(
  snapshot: FinalizedSnapshot,
): boolean {
  return (
    (snapshot.sampleCount ?? 0) <= 1 &&
    Number(snapshot.oiDeltaAccum ?? 0) === 0 &&
    Number(snapshot.fundingAccum ?? 0) === 0 &&
    Number(snapshot.volumeRatioAccum ?? 0) === 0 &&
    Number(snapshot.whaleIntensityAccum ?? 0) === 0
  )
}

async function saveFinalizedSnapshot(
  key: string,
  snapshot: FinalizedSnapshot,
  logLabel:
    | '[FINALIZED_SNAPSHOT_REDIS_SAVE_30M]'
    | '[FINALIZED_SNAPSHOT_REDIS_SAVE_1H]',
) {
  try {
    const existingSnapshot =
      await loadFinalizedSnapshot<FinalizedSnapshot>(
        key,
        logLabel ===
          '[FINALIZED_SNAPSHOT_REDIS_SAVE_30M]'
          ? '[FINALIZED_SNAPSHOT_REDIS_LOAD_30M]'
          : '[FINALIZED_SNAPSHOT_REDIS_LOAD_1H]',
      )

    if (
      existingSnapshot &&
      existingSnapshot.confirmedCandleTs ===
        snapshot.confirmedCandleTs &&
      (snapshot.sampleCount ?? 0) <
        (existingSnapshot.sampleCount ?? 0)
    ) {
      console.log(
        '[FINALIZED_SNAPSHOT_REDIS_SAVE_SKIPPED_LOWER_SAMPLE_COUNT]',
        {
          key,
          confirmedCandleTs:
            snapshot.confirmedCandleTs,
          existingSampleCount:
            existingSnapshot.sampleCount,
          newSampleCount:
            snapshot.sampleCount,
          reason:
            'LOWER_SAMPLE_COUNT_SAME_CONFIRMED_CANDLE',
        },
      )

      return
    }

    if (
      existingSnapshot &&
      isZeroLikeFinalizedSnapshot(snapshot)
    ) {
      console.log(
        '[FINALIZED_SNAPSHOT_REDIS_SAVE_SKIPPED_ZERO_LIKE_SNAPSHOT]',
        {
          key,
          confirmedCandleTs:
            snapshot.confirmedCandleTs,
          existingConfirmedCandleTs:
            existingSnapshot.confirmedCandleTs,
          existingSampleCount:
            existingSnapshot.sampleCount,
          newSampleCount:
            snapshot.sampleCount,
          reason:
            'ZERO_LIKE_SNAPSHOT_WHILE_EXISTING_FINALIZED_PRESENT',
        },
      )

      return
    }

    console.log(
      logLabel,
      {
        key,
        confirmedCandleTs:
          snapshot.confirmedCandleTs,
        sampleCount:
          snapshot.sampleCount,
        oiDeltaAccum:
          snapshot.oiDeltaAccum,
        fundingAccum:
          snapshot.fundingAccum,
        volumeRatioAccum:
          snapshot.volumeRatioAccum,
        whaleIntensityAccum:
          snapshot.whaleIntensityAccum,
      },
    )

    await redis.set(
      key,
      JSON.stringify(snapshot),
    )
  } catch (error) {
    console.error(
      '[FINALIZED_SNAPSHOT_REDIS_SAVE_ERROR]',
      {
        key,
        confirmedCandleTs:
          snapshot.confirmedCandleTs,
        sampleCount:
          snapshot.sampleCount,
        error,
      },
    )
  }
}

async function loadFinalizedSnapshot<
  TSnapshot,
>(
  key: string,
  logLabel:
    | '[FINALIZED_SNAPSHOT_REDIS_LOAD_30M]'
    | '[FINALIZED_SNAPSHOT_REDIS_LOAD_1H]',
): Promise<TSnapshot | null> {
  try {
    const raw = await redis.get(key)

    if (!raw) {
      return null
    }

    if (typeof raw === 'object') {
      console.log(
        logLabel,
        {
          key,
          confirmedCandleTs:
            (raw as any)?.confirmedCandleTs,
          sampleCount:
            (raw as any)?.sampleCount,
        },
      )

      return raw as TSnapshot
    }

    try {
      const parsed = JSON.parse(
        String(raw),
      ) as TSnapshot

      console.log(
        logLabel,
        {
          key,
          confirmedCandleTs:
            (parsed as any)?.confirmedCandleTs,
          sampleCount:
            (parsed as any)?.sampleCount,
        },
      )

      return parsed
    } catch (error) {
      console.error(
        '[FINALIZED_SNAPSHOT_REDIS_PARSE_ERROR]',
        {
          key,
          raw,
          error,
        },
      )

      return null
    }
  } catch (error) {
    console.error(
      '[FINALIZED_SNAPSHOT_REDIS_PARSE_ERROR]',
      {
        key,
        error,
      },
    )

    return null
  }
}

export async function saveFinalized30mSnapshot(
  snapshot: InstitutionalEvidenceSnapshot,
): Promise<void> {
  await saveFinalizedSnapshot(
    FINALIZED_SNAPSHOT_30M_KEY,
    snapshot,
    '[FINALIZED_SNAPSHOT_REDIS_SAVE_30M]',
  )
}

export async function saveFinalized1hSnapshot(
  snapshot: InstitutionalEvidenceSnapshot1h,
): Promise<void> {
  await saveFinalizedSnapshot(
    FINALIZED_SNAPSHOT_1H_KEY,
    snapshot,
    '[FINALIZED_SNAPSHOT_REDIS_SAVE_1H]',
  )
}

export async function loadFinalized30mSnapshot(): Promise<InstitutionalEvidenceSnapshot | null> {
  return loadFinalizedSnapshot<InstitutionalEvidenceSnapshot>(
    FINALIZED_SNAPSHOT_30M_KEY,
    '[FINALIZED_SNAPSHOT_REDIS_LOAD_30M]',
  )
}

export async function loadFinalized1hSnapshot(): Promise<InstitutionalEvidenceSnapshot1h | null> {
  return loadFinalizedSnapshot<InstitutionalEvidenceSnapshot1h>(
    FINALIZED_SNAPSHOT_1H_KEY,
    '[FINALIZED_SNAPSHOT_REDIS_LOAD_1H]',
  )
}
