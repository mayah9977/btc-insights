// app/[locale]/alerts/components/NativeHandoffButton.tsx

'use client'

import { useEffect, useRef, useState } from 'react'

const HANDOFF_ENDPOINT = '/api/native/handoff'
const ANDROID_REFERRER_PREFIX = 'android-app://com.thewhalesbtc.app'
const REQUEST_TIMEOUT_MS = 10_000
const LAUNCH_URL_LIFETIME_MS = 50_000

const EXPECTED_INTENT_PROTOCOL = 'intent:'
const EXPECTED_INTENT_HOST = 'native'
const EXPECTED_INTENT_PATH = '/handoff'
const EXPECTED_INTENT_SCHEME = 'thewhales'
const EXPECTED_PACKAGE = 'com.thewhalesbtc.app'
const EXPECTED_FALLBACK = 'https://www.thewhalesbtc.com/ko/alerts'
const CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/

type HandoffResponse = {
  ok: true
  launchUrl: string
}

type UiState = 'idle' | 'loading' | 'ready' | 'error'

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()

  return (
    actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
  )
}

function isValidIntentLaunchUrl(value: string): boolean {
  if (value.length === 0 || value.length > 4096) {
    return false
  }

  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    return false
  }

  if (parsed.protocol !== EXPECTED_INTENT_PROTOCOL) return false
  if (parsed.hostname !== EXPECTED_INTENT_HOST) return false
  if (parsed.pathname !== EXPECTED_INTENT_PATH) return false
  if (parsed.username !== '' || parsed.password !== '') return false
  if (parsed.port !== '') return false

  const queryKeys = [...parsed.searchParams.keys()]
  if (queryKeys.length !== 1 || queryKeys[0] !== 'code') {
    return false
  }

  const codes = parsed.searchParams.getAll('code')
  if (codes.length !== 1 || !CODE_PATTERN.test(codes[0] ?? '')) {
    return false
  }

  const hash = parsed.hash
  if (!hash.startsWith('#Intent;') || !hash.endsWith(';end')) {
    return false
  }

  const fragmentBody = hash.slice('#Intent;'.length, -';end'.length)
  const fields = fragmentBody.split(';')

  if (fields.length !== 3 || fields.some(field => field.length === 0)) {
    return false
  }

  const fieldMap = new Map<string, string>()

  for (const field of fields) {
    const separator = field.indexOf('=')
    if (separator <= 0) {
      return false
    }

    const key = field.slice(0, separator)
    const fieldValue = field.slice(separator + 1)

    if (fieldMap.has(key)) {
      return false
    }

    fieldMap.set(key, fieldValue)
  }

  if (fieldMap.size !== 3) {
    return false
  }

  if (fieldMap.get('scheme') !== EXPECTED_INTENT_SCHEME) {
    return false
  }

  if (fieldMap.get('package') !== EXPECTED_PACKAGE) {
    return false
  }

  const encodedFallback = fieldMap.get('S.browser_fallback_url')
  if (!encodedFallback) {
    return false
  }

  let fallback: string

  try {
    fallback = decodeURIComponent(encodedFallback)
  } catch {
    return false
  }

  return fallback === EXPECTED_FALLBACK
}

function isValidHandoffResponse(value: unknown): value is HandoffResponse {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false
  }

  const record = value as Record<string, unknown>

  if (!hasExactKeys(record, ['ok', 'launchUrl'])) {
    return false
  }

  return (
    record.ok === true &&
    typeof record.launchUrl === 'string' &&
    isValidIntentLaunchUrl(record.launchUrl)
  )
}

function shouldShowHandoffUi(): boolean {
  const isAndroid = /Android/i.test(navigator.userAgent)
  if (!isAndroid) {
    return false
  }

  const fromTrustedAndroidApp = document.referrer.startsWith(
    ANDROID_REFERRER_PREFIX,
  )

  const standalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches

  return fromTrustedAndroidApp || standalone
}

export default function NativeHandoffButton() {
  const [visible, setVisible] = useState(false)
  const [uiState, setUiState] = useState<UiState>('idle')
  const [launchUrl, setLaunchUrl] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const mountedRef = useRef(false)
  const requestInFlightRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const requestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const expiryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const countdownIntervalRef = useRef<
    ReturnType<typeof setInterval> | null
  >(null)

  function clearRequestTimeout() {
    if (requestTimeoutRef.current !== null) {
      clearTimeout(requestTimeoutRef.current)
      requestTimeoutRef.current = null
    }
  }

  function clearExpiryTimers() {
    if (expiryTimeoutRef.current !== null) {
      clearTimeout(expiryTimeoutRef.current)
      expiryTimeoutRef.current = null
    }

    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }

  function clearLaunchUrl() {
    clearExpiryTimers()

    if (!mountedRef.current) {
      return
    }

    setLaunchUrl(null)
    setSecondsLeft(0)
    setUiState('idle')
  }

  function startExpiryWindow() {
    clearExpiryTimers()

    const expiresAt = Date.now() + LAUNCH_URL_LIFETIME_MS
    setSecondsLeft(Math.ceil(LAUNCH_URL_LIFETIME_MS / 1000))

    countdownIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) {
        return
      }

      const remaining = Math.max(
        0,
        Math.ceil((expiresAt - Date.now()) / 1000),
      )

      setSecondsLeft(remaining)
    }, 1000)

    expiryTimeoutRef.current = setTimeout(() => {
      clearLaunchUrl()
    }, LAUNCH_URL_LIFETIME_MS)
  }

  useEffect(() => {
    mountedRef.current = true
    setVisible(shouldShowHandoffUi())

    return () => {
      mountedRef.current = false

      abortControllerRef.current?.abort()
      abortControllerRef.current = null

      clearRequestTimeout()
      clearExpiryTimers()
    }
  }, [])

  async function createHandoff() {
    if (requestInFlightRef.current || uiState === 'loading') {
      return
    }

    requestInFlightRef.current = true
    clearExpiryTimers()

    if (mountedRef.current) {
      setLaunchUrl(null)
      setSecondsLeft(0)
      setUiState('loading')
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    requestTimeoutRef.current = setTimeout(() => {
      controller.abort()
    }, REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(HANDOFF_ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        redirect: 'error',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error('HANDOFF_REQUEST_FAILED')
      }

      const payload: unknown = await response.json()

      if (!isValidHandoffResponse(payload)) {
        throw new Error('HANDOFF_RESPONSE_INVALID')
      }

      if (!mountedRef.current) {
        return
      }

      setLaunchUrl(payload.launchUrl)
      setUiState('ready')
      startExpiryWindow()
    } catch {
      if (!mountedRef.current) {
        return
      }

      setLaunchUrl(null)
      setSecondsLeft(0)
      setUiState('error')
    } finally {
      clearRequestTimeout()

      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }

      requestInFlightRef.current = false
    }
  }

  if (!visible) {
    return null
  }

  return (
    <div className="relative z-10 mx-auto mt-4 w-full max-w-[420px] px-4 sm:max-w-5xl">
      <div className="rounded-2xl border border-white/10 bg-[#0c1224]/90 p-4">
        <div className="text-sm font-bold text-white">
          THE WHALES Android 앱
        </div>

        <div className="mt-1 text-xs leading-5 text-white/60">
          이 기기에서 앱과 알림 연결을 계속할 수 있습니다.
        </div>

        {uiState === 'idle' && (
          <button
            type="button"
            onClick={() => {
              void createHandoff()
            }}
            className="mt-3 w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-extrabold text-[#041018] transition hover:bg-cyan-300"
          >
            앱 연결 준비
          </button>
        )}

        {uiState === 'loading' && (
          <button
            type="button"
            disabled
            className="mt-3 w-full cursor-not-allowed rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white/50"
          >
            연결 준비 중...
          </button>
        )}

        {uiState === 'ready' && launchUrl !== null && (
          <>
            <a
              href={launchUrl}
              className="mt-3 block w-full rounded-xl bg-cyan-400 px-4 py-3 text-center text-sm font-extrabold text-[#041018] transition hover:bg-cyan-300"
            >
              앱에서 계속
            </a>

            <div className="mt-2 text-center text-[11px] text-white/50">
              이 링크는 약 {secondsLeft}초 후 만료됩니다.
            </div>
          </>
        )}

        {uiState === 'error' && (
          <>
            <div
              role="status"
              className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200"
            >
              앱 연결을 준비하지 못했습니다. 잠시 후 다시 시도해주세요.
            </div>

            <button
              type="button"
              onClick={() => {
                void createHandoff()
              }}
              className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              다시 시도
            </button>
          </>
        )}
      </div>
    </div>
  )
}
