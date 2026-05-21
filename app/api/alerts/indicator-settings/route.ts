// /app/api/alerts/indicator-settings/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { setIndicatorEnabled } from '@/lib/alerts/indicatorEngine'
import { redis } from '@/lib/redis' // 🔥 [기존] Redis 사용

export const runtime = 'nodejs'

type Timeframe = '15m' | '1h'

type IndicatorType = 'RSI' | 'MACD' | 'EMA'

type IndicatorEnabled = Record<
  IndicatorType,
  Record<Timeframe, boolean>
>

/* =========================
 * 🔥 Redis Key
 * ========================= */
const REDIS_KEY = 'alerts:indicator:enabled'

/* =========================
 * 🔥 기본 fallback
 * ========================= */
const DEFAULT_SETTINGS: IndicatorEnabled = {
  RSI: {
    '15m': true,
    '1h': true,
  },

  MACD: {
    '15m': true,
    '1h': true,
  },

  EMA: {
    '15m': true,
    '1h': true,
  },
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function normalizeIndicatorBranch(
  value: unknown,
  fallback: Record<Timeframe, boolean>,
): Record<Timeframe, boolean> {
  /**
   * 🔥 Legacy migration-safe
   *
   * 기존:
   * RSI: true
   *
   * 신규:
   * RSI: {
   *   '15m': true,
   *   '1h': true,
   * }
   */
  if (isBoolean(value)) {
    return {
      '15m': value,
      '1h': value,
    }
  }

  if (!value || typeof value !== 'object') {
    return {
      ...fallback,
    }
  }

  const candidate =
    value as Partial<Record<Timeframe, unknown>>

  return {
    '15m': isBoolean(candidate['15m'])
      ? candidate['15m']
      : fallback['15m'],

    '1h': isBoolean(candidate['1h'])
      ? candidate['1h']
      : fallback['1h'],
  }
}

function normalizeIndicatorEnabled(
  value: unknown,
): IndicatorEnabled {
  if (!value || typeof value !== 'object') {
    return {
      RSI: {
        ...DEFAULT_SETTINGS.RSI,
      },

      MACD: {
        ...DEFAULT_SETTINGS.MACD,
      },

      EMA: {
        ...DEFAULT_SETTINGS.EMA,
      },
    }
  }

  const candidate =
    value as Partial<Record<IndicatorType, unknown>>

  return {
    RSI: normalizeIndicatorBranch(
      candidate.RSI,
      DEFAULT_SETTINGS.RSI,
    ),

    MACD: normalizeIndicatorBranch(
      candidate.MACD,
      DEFAULT_SETTINGS.MACD,
    ),

    EMA: normalizeIndicatorBranch(
      candidate.EMA,
      DEFAULT_SETTINGS.EMA,
    ),
  }
}

/* =========================
 * GET → Redis에서 상태 조회
 * ========================= */
export async function GET() {
  try {
    const raw = await redis.get(REDIS_KEY)

    if (!raw) {
      const fallback =
        normalizeIndicatorEnabled(
          DEFAULT_SETTINGS,
        )

      /* =========================
       * 🔥 Redis에 fallback 저장
       * ========================= */
      try {
        await redis.set(
          REDIS_KEY,
          JSON.stringify(fallback),
        )

        console.log(
          '[indicator-settings][GET] fallback saved to Redis',
        )
      } catch (err) {
        console.error(
          '[indicator-settings][GET][SET ERROR]',
          err,
        )
      }

      return NextResponse.json({
        ok: true,
        data: fallback,
      })
    }

    const parsed = JSON.parse(raw)

    const normalized =
      normalizeIndicatorEnabled(parsed)

    /**
     * 🔥 Migration-safe writeback
     *
     * legacy boolean schema →
     * nested timeframe-aware schema 자동 보정
     */
    try {
      await redis.set(
        REDIS_KEY,
        JSON.stringify(normalized),
      )
    } catch (err) {
      console.error(
        '[indicator-settings][GET][MIGRATION SAVE ERROR]',
        err,
      )
    }

    return NextResponse.json({
      ok: true,
      data: normalized,
    })
  } catch (e) {
    console.error('[indicator-settings][GET]', e)

    // 🔥 [보완] 에러 시에도 fallback 생성 + Redis 저장 시도
    const fallback =
      normalizeIndicatorEnabled(
        DEFAULT_SETTINGS,
      )

    try {
      await redis.set(
        REDIS_KEY,
        JSON.stringify(fallback),
      )

      console.log(
        '[indicator-settings][GET][ERROR FALLBACK SAVED]',
      )
    } catch {}

    return NextResponse.json({
      ok: false,
      data: fallback,
    })
  }
}

/* =========================
 * POST → Redis 저장 + 메모리 반영
 * ========================= */
export async function POST(
  req: NextRequest,
) {
  try {
    const body = await req.json()

    const next =
      normalizeIndicatorEnabled(body)

    /* 🔥 Redis 저장 */
    await redis.set(
      REDIS_KEY,
      JSON.stringify(next),
    )

    /* 🔥 메모리 반영 */
    setIndicatorEnabled(next)

    return NextResponse.json({
      ok: true,
    })
  } catch (e) {
    console.error(
      '[indicator-settings][POST]',
      e,
    )

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    )
  }
}
