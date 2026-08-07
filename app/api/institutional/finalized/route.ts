// app/api/institutional/finalized/route.ts

import { NextResponse } from 'next/server'

import {
  loadFinalized30mSnapshot,
  loadFinalized1hSnapshot,
  loadLatestInstitutionalEvaluation,
} from '@/lib/market/institutional/server/finalizedSnapshotRepository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [
      snapshot30m,
      snapshot1h,
      latestEvaluation,
    ] = await Promise.all([
      loadFinalized30mSnapshot(),
      loadFinalized1hSnapshot(),
      loadLatestInstitutionalEvaluation(),
    ])

    return NextResponse.json(
      {
        ok: true,
        snapshot30m,
        snapshot1h,
        latestEvaluation,
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
        latestEvaluation: null,
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
