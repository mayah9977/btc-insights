// app/api/alerts/institutional-pattern/route.ts

import { NextRequest, NextResponse } from 'next/server'

import { redis } from '@/lib/redis'
import { saveNotification } from '@/lib/notification/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type InstitutionalPatternSignalPayload = {
  type: 'INSTITUTIONAL_PATTERN_SIGNAL'
  pattern: string
  intensity: string
  risk: string
  summary: string
  confirmedCandleTs: number
  ts: number
}

const CHANNEL = 'realtime:alerts'

const VALID_INTENSITY = new Set<string>([
  'WEAK',
  'BUILDING',
  'AGGRESSIVE',
  'EXTREME',
])

const VALID_RISK = new Set<string>([
  'LOW',
  'MEDIUM',
  'HIGH',
])

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  )
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

function validatePayload(
  body: unknown,
): body is InstitutionalPatternSignalPayload {
  if (
    !body ||
    typeof body !== 'object'
  ) {
    return false
  }

  const payload =
    body as Partial<InstitutionalPatternSignalPayload>

  if (
    payload.type !==
    'INSTITUTIONAL_PATTERN_SIGNAL'
  ) {
    return false
  }

  if (!isNonEmptyString(payload.pattern)) {
    return false
  }

  const intensity = payload.intensity

  if (
    !isNonEmptyString(intensity) ||
    !VALID_INTENSITY.has(intensity)
  ) {
    return false
  }

  const risk = payload.risk

  if (
    !isNonEmptyString(risk) ||
    !VALID_RISK.has(risk)
  ) {
    return false
  }

  if (!isNonEmptyString(payload.summary)) {
    return false
  }

  if (
    !isFiniteNumber(
      payload.confirmedCandleTs,
    )
  ) {
    return false
  }

  if (!isFiniteNumber(payload.ts)) {
    return false
  }

  return true
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown = null

    try {
      body = await req.json()
    } catch (error) {
      console.error(
        '[INSTITUTIONAL_PATTERN_ROUTE][INVALID_JSON]',
        error,
      )

      return NextResponse.json(
        {
          ok: false,
          reason: 'invalid-json-body',
        },
        { status: 400 },
      )
    }

    if (!validatePayload(body)) {
      console.error(
        '[INSTITUTIONAL_PATTERN_ROUTE][INVALID_PAYLOAD]',
        body,
      )

      return NextResponse.json(
        {
          ok: false,
          reason: 'invalid-payload',
        },
        { status: 400 },
      )
    }

    const payload: InstitutionalPatternSignalPayload =
      {
        type:
          'INSTITUTIONAL_PATTERN_SIGNAL',

        pattern: body.pattern.trim(),

        intensity: body.intensity,

        risk: body.risk,

        summary: body.summary.trim(),

        confirmedCandleTs:
          body.confirmedCandleTs,

        ts: body.ts,
      }

    const notificationId =
      `institutional:${payload.pattern}:${payload.confirmedCandleTs}`

    try {
      console.log(
        '[INSTITUTIONAL_PATTERN_ROUTE][SAVE_ATTEMPT]',
        {
          id: notificationId,
          pattern: payload.pattern,
          intensity: payload.intensity,
          confirmedCandleTs:
            payload.confirmedCandleTs,
          createdAt: payload.ts,
        },
      )

      await saveNotification({
        id: notificationId,
        type: 'INSTITUTIONAL_PATTERN',
        title: 'Institutional Flow Signal',
        body: `${payload.pattern} · ${payload.intensity}`,
        createdAt: payload.ts,
      })

      console.log(
        '[INSTITUTIONAL_PATTERN_ROUTE][SAVE_RESULT]',
        {
          ok: true,
          id: notificationId,
        },
      )
    } catch (error) {
      console.error(
        '[INSTITUTIONAL_PATTERN_ROUTE][SAVE_ERROR]',
        {
          id: notificationId,
          error,
        },
      )
    }

    await redis.publish(
      CHANNEL,
      JSON.stringify(payload),
    )

    console.log(
      '[INSTITUTIONAL_PATTERN_ROUTE][PUBLISHED]',
      payload,
    )

    return NextResponse.json({
      ok: true,
    })
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_PATTERN_ROUTE][ERROR]',
      error,
    )

    return NextResponse.json(
      {
        ok: false,
        reason: 'publish-failed',
      },
      { status: 500 },
    )
  }
}
