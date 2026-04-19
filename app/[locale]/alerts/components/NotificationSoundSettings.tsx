// /app/[locale]/alerts/components/NotificationSoundSettings.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import {
  defaultNotificationSettings,
  type NotificationSettings,
  type NotificationSound,
} from '@/lib/notification/notificationSettings'
import {
  getUserNotificationSettings,
  saveUserNotificationSettings,
} from '@/lib/notification/settingsStore'

const SOUND_OPTIONS: Array<{
  value: NotificationSound
  label: string
}> = [
  { value: 'default', label: '기본' },
  { value: 'alert1', label: '알림음 1' },
  { value: 'alert2', label: '알림음 2' },
  { value: 'siren', label: '사이렌' },
]

function getSoundFilePath(type: NotificationSound) {
  const map: Record<NotificationSound, string> = {
    default: '/sounds/default.mp3',
    alert1: '/sounds/alert1.mp3',
    alert2: '/sounds/alert2.mp3',
    siren: '/sounds/siren.mp3',
  }
  return map[type]
}

export default function NotificationSoundSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(
    defaultNotificationSettings,
  )
  const [isOpen, setIsOpen] = useState(false)

  // ✅ 미리듣기 상태
  const [isPlaying, setIsPlaying] = useState(false)

  // ✅ 단일 Audio 객체 관리
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    ;(async () => {
      const current = await getUserNotificationSettings('local')
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
    await saveUserNotificationSettings('local', next)
  }

  // ✅ 미리듣기 재생
  const playPreview = () => {
    if (!settings.soundEnabled) return

    try {
      // 기존 재생 중이면 정지
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      const audio = new Audio(getSoundFilePath(settings.soundType))
      audio.volume = 1.0

      audioRef.current = audio

      audio.onended = () => {
        setIsPlaying(false)
      }

      audio.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {})
    } catch {}
  }

  // ✅ 미리듣기 정지
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
        onClick={() => setIsOpen(prev => !prev)}
        className="flex w-full items-center justify-between text-sm font-bold text-yellow-400"
      >
        <span>알림음 설정</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-white">사운드 사용</span>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={e =>
                updateSettings({ soundEnabled: e.target.checked })
              }
            />
          </label>

          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-white">진동 사용</span>
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={e =>
                updateSettings({
                  vibrationEnabled: e.target.checked,
                })
              }
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-white">알림음 선택</span>
            <select
              value={settings.soundType}
              onChange={e =>
                updateSettings({
                  soundType: e.target.value as NotificationSound,
                })
              }
              className="rounded-lg border border-white/10 bg-[#0c1224] px-3 py-2 text-white"
            >
              {SOUND_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* ✅ 미리듣기 버튼 */}
          {!isPlaying && (
            <button
              onClick={playPreview}
              className="w-full rounded-lg bg-yellow-500 py-2 text-sm font-bold text-black hover:bg-yellow-400"
            >
              미리듣기
            </button>
          )}

          {/* ✅ 미리듣기 정지 버튼 */}
          {isPlaying && (
            <button
              onClick={stopPreview}
              className="w-full rounded-lg bg-red-500 py-2 text-sm font-bold text-white hover:bg-red-400"
            >
              🔕 미리듣기 정지
            </button>
          )}
        </div>
      )}
    </div>
  )
}
