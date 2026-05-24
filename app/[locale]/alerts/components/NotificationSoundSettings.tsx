// app/[locale]/alerts/components/NotificationSoundSettings.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

import {
  defaultNotificationSettings,
  type IndicatorTimeframe,
  type IndicatorType,
  type NotificationSettings,
  type NotificationSound,
} from '@/lib/notification/notificationSettings'

import {
  getUserNotificationSettings,
  saveUserNotificationSettings,
} from '@/lib/notification/settingsStore'

import { getUserVIP } from '@/lib/auth/getUserVIP'

import VIPUpgradeModal from './VIPUpgradeModal'

const SOUND_OPTIONS: Array<{
  value: NotificationSound
  label: string
}> = [
  { value: 'default', label: '기본' },
  { value: 'alert1', label: '알림음 1' },
  { value: 'alert2', label: '알림음 2' },
  { value: 'siren', label: '사이렌' },
]

const INDICATOR_ALERT_OPTIONS: Array<{
  indicator: IndicatorType
  title: string
  subtitle: string
  rows: Array<{
    timeframe: IndicatorTimeframe
    badge: string
    layer: string
    title: string
    description: string
  }>
}> = [
  {
    indicator: 'RSI',
    title: 'RSI 과매수/과매도 신호 알람',
    subtitle:
      'Relative strength transition tracking',
    rows: [
      {
        timeframe: '15m',
        badge: '15M',
        layer: '과매수/과매도',
        title:
          'Momentum Overbought(과매수) / Oversold(과매도)',
        description:
          'Realtime momentum expansion and compression flow',
      },
      {
        timeframe: '1h',
        badge: '1H',
        layer: '과매수/과매도',
        title:
          'Structure Overheat(과매수) / Compression(과매도)',
        description:
          'Higher timeframe directional pressure structure',
      },
    ],
  },

  {
    indicator: 'MACD',
    title: 'MACD 골든크로스 / 데드크로스',
    subtitle:
      'Directional transition and structure alignment',
    rows: [
      {
        timeframe: '15m',
        badge: '15M',
        layer: '골든크로스 / 데드크로스',
        title:
          'Momentum Golden / Dead Cross',
        description:
          'Short-term directional momentum transition',
      },
      {
        timeframe: '1h',
        badge: '1H',
        layer: '골든크스 / 데드크로스',
        title:
          'Structure Alignment Shift',
        description:
          'Higher timeframe directional structure transition',
      },
    ],
  },

  {
    indicator: 'EMA',
    title: 'EMA 추세전환 신호알람',
    subtitle:
      'Trend crossover and structure interpretation',
    rows: [
      {
        timeframe: '15m',
        badge: '15M',
        layer: '추세전환',
        title:
          'Trend Cross Signal',
        description:
          'Realtime momentum trend crossover flow',
      },
      {
        timeframe: '1h',
        badge: '1H',
        layer: '추세전환',
        title:
          'Higher Timeframe Trend Structure',
        description:
          'Macro directional structure alignment',
      },
    ],
  },
]

function getSoundFilePath(
  type: NotificationSound,
) {
  const map: Record<
    NotificationSound,
    string
  > = {
    default: '/sounds/default.mp3',
    alert1: '/sounds/alert1.mp3',
    alert2: '/sounds/alert2.mp3',
    siren: '/sounds/siren.mp3',
  }

  return map[type]
}

export default function NotificationSoundSettings({
  isVIP: isVIPProp,
}: {
  isVIP?: boolean
} = {}) {
  const [settings, setSettings] =
    useState<NotificationSettings>(
      defaultNotificationSettings,
    )

  const [isOpen, setIsOpen] =
    useState(false)

  const [isPlaying, setIsPlaying] =
    useState(false)

  const [showUpgradeModal, setShowUpgradeModal] =
    useState(false)

  const [resolvedIsVIP, setResolvedIsVIP] =
    useState<boolean | null>(
      typeof isVIPProp === 'boolean'
        ? isVIPProp
        : null,
    )

  const audioRef =
    useRef<HTMLAudioElement | null>(
      null,
    )

  const isVIP =
    typeof isVIPProp === 'boolean'
      ? isVIPProp
      : resolvedIsVIP === true

  const vipResolved =
    typeof isVIPProp === 'boolean' ||
    resolvedIsVIP !== null

  const vipFeatureLocked =
    vipResolved && !isVIP

  useEffect(() => {
    if (typeof isVIPProp === 'boolean') {
      setResolvedIsVIP(isVIPProp)
      return
    }

    ;(async () => {
      const vip = await getUserVIP()
      setResolvedIsVIP(vip)
    })()
  }, [isVIPProp])

  useEffect(() => {
    ;(async () => {
      const current =
        await getUserNotificationSettings(
          'local',
        )

      setSettings(current)
    })()
  }, [])

  const updateSettings = async (
    patch: Partial<NotificationSettings>,
  ) => {
    const next = {
      ...settings,
      ...patch,
    }

    setSettings(next)

    await saveUserNotificationSettings(
      'local',
      next,
    )
  }

  const updateVIPOnlySettings =
    async (
      patch: Partial<NotificationSettings>,
    ) => {
      if (!isVIP) {
        if (vipResolved) {
          setShowUpgradeModal(true)
        }

        return
      }

      await updateSettings(patch)
    }

  const updateIndicatorTimeframe =
    async (
      indicator: IndicatorType,
      timeframe: IndicatorTimeframe,
      enabled: boolean,
    ) => {
      if (!isVIP) {
        if (vipResolved) {
          setShowUpgradeModal(true)
        }

        return
      }

      await updateSettings({
        indicatorEnabled: {
          ...settings.indicatorEnabled,
          [indicator]: {
            ...settings.indicatorEnabled[
              indicator
            ],
            [timeframe]: enabled,
          },
        },
      })
    }

  const playPreview = () => {
    if (!settings.soundEnabled) {
      return
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      const audio = new Audio(
        getSoundFilePath(
          settings.soundType,
        ),
      )

      audio.volume = 1.0

      audioRef.current = audio

      audio.onended = () => {
        setIsPlaying(false)
      }

      audio
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch(() => {})
    } catch {}
  }

  const stopPreview = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
    } catch {}

    setIsPlaying(false)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <button
        type="button"
        onClick={() =>
          setIsOpen(prev => !prev)
        }
        className="flex w-full items-center justify-between text-sm font-bold text-yellow-400"
      >
        <span>
          보조지표 / 기관압력 알람 설정하기
        </span>

        <span>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <label
            className="
              flex
              items-start
              justify-between
              gap-3
              rounded-2xl
              border
              border-cyan-400/15
              bg-cyan-400/[0.04]
              px-4
              py-4
            "
          >
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className="
                    rounded-md
                    border
                    border-cyan-400/20
                    bg-cyan-500/10
                    px-2
                    py-0.5
                    text-[10px]
                    font-bold
                    tracking-[0.14em]
                    text-cyan-200
                  "
                >
                  FLOW
                </span>

                <span className="text-sm font-semibold text-cyan-100">
                  Institutional Flow Alert
                  (기관급 고래 압력 알람)
                </span>
              </span>

              <span className="mt-2 block text-[11px] leading-relaxed text-white/45">
                30분 누적 기관 압력 변화 및
                구조적 포지셔닝 흐름이
                감지되면 실시간 알림을
                보냅니다.
              </span>

              {/* 상태 배지 */}
              <div
                className={clsx(
                  'mt-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em]',
                  settings.institutionalPatternEnabled
                    ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                    : 'border-white/10 bg-white/[0.04] text-white/45',
                )}
              >
                {settings.institutionalPatternEnabled
                  ? '🟢 실시간 알림 카드 수신중'
                  : '⚪ 알림 카드 비활성화됨'}
              </div>
            </span>

            <input
              type="checkbox"
              checked={
                settings.institutionalPatternEnabled
              }
              onChange={e =>
                updateVIPOnlySettings({
                  institutionalPatternEnabled:
                    e.target.checked,
                })
              }
              disabled={vipFeatureLocked}
              className="mt-1 shrink-0"
            />
          </label>

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-black/15
              px-3
              py-3
            "
          >
            <div className="px-1">
              <div className="text-sm font-semibold text-white">
                Indicator Alert Layers(인디케이터 알람)
              </div>

              <div className="mt-1 text-[11px] leading-relaxed text-white/45">
                15M은 실시간 Momentum
                Layer, 1H는 상위 Structure
                Layer 기반으로 개별 알림을
                제어합니다.
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {INDICATOR_ALERT_OPTIONS.map(
                group => (
                  <div
                    key={group.indicator}
                    className="
                      rounded-xl
                      border
                      border-white/10
                      bg-white/[0.03]
                      p-3
                    "
                  >
                    <div className="px-1">
                      <div className="text-[11px] font-bold tracking-[0.16em] text-white/75">
                        {group.title}
                      </div>

                      <div className="mt-1 text-[11px] leading-relaxed text-white/40">
                        {group.subtitle}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {group.rows.map(
                        row => {
                          const checked =
                            settings
                              .indicatorEnabled[
                              group.indicator
                            ][
                              row.timeframe
                            ]

                          const isStructure =
                            row.timeframe ===
                            '1h'

                          return (
                            <label
                              key={`${group.indicator}-${row.timeframe}`}
                              className="
                                flex
                                items-start
                                justify-between
                                gap-3
                                rounded-xl
                                border
                                border-white/5
                                bg-white/[0.025]
                                px-3
                                py-3
                              "
                            >
                              <span className="min-w-0">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`
                                      rounded-md
                                      border
                                      px-2
                                      py-0.5
                                      text-[10px]
                                      font-bold
                                      tracking-[0.14em]
                                      ${
                                        isStructure
                                          ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200'
                                          : 'border-indigo-400/20 bg-indigo-500/10 text-indigo-200'
                                      }
                                    `}
                                  >
                                    {
                                      row.badge
                                    }
                                  </span>

                                  <span className="text-xs font-semibold text-white/90">
                                    {
                                      row.layer
                                    }
                                  </span>
                                </span>

                                <span className="mt-2 block text-xs font-medium text-white/80">
                                  {
                                    row.title
                                  }
                                </span>

                                <span className="mt-1 block text-[11px] leading-relaxed text-white/45">
                                  {
                                    row.description
                                  }
                                </span>

                                {/* 상태 배지 */}
                                <div
                                  className={clsx(
                                    'mt-2 inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold tracking-[0.06em]',
                                    checked
                                      ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                                      : 'border-white/10 bg-white/[0.04] text-white/45',
                                  )}
                                >
                                  {checked
                                    ? '🟢 실시간 알림 활성'
                                    : '⚪ 알림 OFF'}
                                </div>
                              </span>

                              <input
                                type="checkbox"
                                checked={
                                  checked
                                }
                                onChange={e =>
                                  updateIndicatorTimeframe(
                                    group.indicator,
                                    row.timeframe,
                                    e.target
                                      .checked,
                                  )
                                }
                                disabled={
                                  vipFeatureLocked
                                }
                                className="mt-1 shrink-0"
                              />
                            </label>
                          )
                        },
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-white">
              사운드 사용
            </span>

            <input
              type="checkbox"
              checked={
                settings.soundEnabled
              }
              onChange={e =>
                updateSettings({
                  soundEnabled:
                    e.target.checked,
                })
              }
            />
          </label>

          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-white">
              진동 사용
            </span>

            <input
              type="checkbox"
              checked={
                settings.vibrationEnabled
              }
              onChange={e =>
                updateSettings({
                  vibrationEnabled:
                    e.target.checked,
                })
              }
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-white">
              알림음 선택
            </span>

            <select
              value={settings.soundType}
              onChange={e =>
                updateSettings({
                  soundType:
                    e.target
                      .value as NotificationSound,
                })
              }
              className="rounded-lg border border-white/10 bg-[#0c1224] px-3 py-2 text-white"
            >
              {SOUND_OPTIONS.map(
                option => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>

          {vipFeatureLocked && (
            <div className="text-center text-xs text-white/50 mt-2">
              Institutional Flow /
              Indicator Alert 기능은
              VIP 전용입니다.
            </div>
          )}

          {!isPlaying && (
            <button
              type="button"
              onClick={playPreview}
              className="w-full rounded-lg bg-yellow-500 py-2 text-sm font-bold text-black hover:bg-yellow-400"
            >
              미리듣기
            </button>
          )}

          {isPlaying && (
            <button
              type="button"
              onClick={stopPreview}
              className="w-full rounded-lg bg-red-500 py-2 text-sm font-bold text-white hover:bg-red-400"
            >
              🔕 미리듣기 정지
            </button>
          )}

          {showUpgradeModal && (
            <VIPUpgradeModal
              onClose={() =>
                setShowUpgradeModal(false)
              }
            />
          )}
        </div>
      )}
    </div>
  )
}
