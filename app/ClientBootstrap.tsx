//app/ClientBootstrap.tsx

'use client'

import { useEffect, useRef } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'
import { registerPushToken } from '@/lib/notification/registerPushToken'

const SURFACE_BOOTSTRAP_ENDPOINT = '/api/native/surface'
const SURFACE_BOOTSTRAP_TIMEOUT_MS = 5_000

type SurfaceBootstrapResponse = {
  ok: true
}

function isSurfaceBootstrapResponse(
  value: unknown,
): value is SurfaceBootstrapResponse {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false
  }

  const record = value as Record<string, unknown>
  const keys = Object.keys(record)

  return (
    keys.length === 1 &&
    keys[0] === 'ok' &&
    record.ok === true
  )
}

async function bootstrapNativeSurface(): Promise<void> {
  const controller = new AbortController()

  const timeout = window.setTimeout(() => {
    controller.abort()
  }, SURFACE_BOOTSTRAP_TIMEOUT_MS)

  try {
    const response = await fetch(
      SURFACE_BOOTSTRAP_ENDPOINT,
      {
        method: 'POST',
        credentials: 'same-origin',
        redirect: 'error',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      return
    }

    const payload: unknown = await response
      .json()
      .catch(() => null)

    if (!isSurfaceBootstrapResponse(payload)) {
      return
    }
  } catch {
    return
  } finally {
    window.clearTimeout(timeout)
  }
}

export default function ClientBootstrap() {
  const bootstrapAlertsSSE = useAlertsSSEStore(
    s => s.bootstrap,
  )

  const surfaceBootstrapPromiseRef =
    useRef<Promise<void> | null>(null)

  const pushRegistrationPromiseRef =
    useRef<Promise<void> | null>(null)

  useEffect(() => {
    bootstrapAlertsSSE()

    if (!surfaceBootstrapPromiseRef.current) {
      surfaceBootstrapPromiseRef.current =
        bootstrapNativeSurface()
    }

    if (!pushRegistrationPromiseRef.current) {
      pushRegistrationPromiseRef.current =
        surfaceBootstrapPromiseRef.current
          .catch(() => {})
          .then(async () => {
            try {
              await registerPushToken()
            } catch {
              return
            }
          })
    }
  }, [bootstrapAlertsSSE])

  return <Toaster position="bottom-right" />
}
