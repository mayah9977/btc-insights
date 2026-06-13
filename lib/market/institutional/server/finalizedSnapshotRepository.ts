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

async function saveFinalizedSnapshot(
  key: string,
  snapshot:
    | InstitutionalEvidenceSnapshot
    | InstitutionalEvidenceSnapshot1h,
  logLabel:
    | '[FINALIZED_SNAPSHOT_REDIS_SAVE_30M]'
    | '[FINALIZED_SNAPSHOT_REDIS_SAVE_1H]',
) {
  void logLabel

  try {
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
  void logLabel

  try {
    const raw = await redis.get(key)

    if (!raw) {
      return null
    }

    if (typeof raw === 'object') {
      return raw as TSnapshot
    }

    try {
      const parsed = JSON.parse(
        String(raw),
      ) as TSnapshot

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
