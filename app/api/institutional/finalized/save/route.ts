// app/api/institutional/finalized/save/route.ts

import { NextResponse } from 'next/server'

import {
  saveFinalized30mSnapshot,
  saveFinalized1hSnapshot,
} from '@/lib/market/institutional/server/finalizedSnapshotRepository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type FinalizedSnapshotSaveRequest = {
  timeframe?: '30m' | '1h'
  snapshot?: any
}

function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

export async function POST(req: Request) {
  const ts = Date.now()

  try {
    let body: FinalizedSnapshotSaveRequest | null =
      null

    try {
      body =
        (await req.json()) as FinalizedSnapshotSaveRequest
    } catch (error) {
      console.error(
        '[FINALIZED_SNAPSHOT_SAVE_API_ERROR]',
        {
          ts,
          reason: 'invalid-json-body',
          error,
        },
      )

      return NextResponse.json(
        {
          ok: false,
          error: 'invalid-json-body',
          ts: Date.now(),
        },
        { status: 400 },
      )
    }

    const timeframe = body?.timeframe
    const snapshot = body?.snapshot

    if (
      timeframe !== '30m' &&
      timeframe !== '1h'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'invalid-timeframe',
          ts: Date.now(),
        },
        { status: 400 },
      )
    }

    if (
      !snapshot ||
      typeof snapshot !== 'object'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'invalid-snapshot',
          ts: Date.now(),
        },
        { status: 400 },
      )
    }

    if (
      typeof snapshot.confirmedCandleTs !==
      'number'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'invalid-confirmedCandleTs',
          ts: Date.now(),
        },
        { status: 400 },
      )
    }

    if (timeframe === '30m') {
      await saveFinalized30mSnapshot(
        snapshot,
      )
    } else {
      await saveFinalized1hSnapshot(
        snapshot,
      )
    }

    return NextResponse.json(
      {
        ok: true,
        timeframe,
        confirmedCandleTs:
          snapshot.confirmedCandleTs,
        ts: Date.now(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    console.error(
      '[FINALIZED_SNAPSHOT_SAVE_API_ERROR]',
      {
        ts,
        error,
      },
    )

    return NextResponse.json(
      {
        ok: false,
        error: serializeError(error),
        ts: Date.now(),
      },
      {
        status: 500,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  }
}
