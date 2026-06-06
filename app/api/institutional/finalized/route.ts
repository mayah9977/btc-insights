import { NextResponse } from 'next/server'

import {
  loadFinalized30mSnapshot,
  loadFinalized1hSnapshot,
} from '@/lib/market/institutional/server/finalizedSnapshotRepository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ts = Date.now()

    console.log(
      '[FINALIZED_SNAPSHOT_API_REQUEST]',
      {
        ts,
      },
    )

    const [
      snapshot30m,
      snapshot1h,
    ] = await Promise.all([
      loadFinalized30mSnapshot(),
      loadFinalized1hSnapshot(),
    ])

    console.log(
      '[FINALIZED_SNAPSHOT_API_RESPONSE]',
      {
        ts: Date.now(),
        requestTs: ts,

        snapshot30mReady:
          snapshot30m !== null,

        snapshot30mConfirmedCandleTs:
          snapshot30m
            ?.confirmedCandleTs,

        snapshot30mSampleCount:
          snapshot30m
            ?.sampleCount,

        snapshot1hReady:
          snapshot1h !== null,

        snapshot1hConfirmedCandleTs:
          snapshot1h
            ?.confirmedCandleTs,

        snapshot1hSampleCount:
          snapshot1h
            ?.sampleCount,
      },
    )

    return NextResponse.json(
      {
        ok: true,
        snapshot30m,
        snapshot1h,
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
      '[FINALIZED_SNAPSHOT_API_ERROR]',
      {
        ts: Date.now(),
        error,
      },
    )

    return NextResponse.json(
      {
        ok: false,
        snapshot30m: null,
        snapshot1h: null,
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
