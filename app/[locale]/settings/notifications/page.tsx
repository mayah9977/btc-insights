'use client'

import { useState } from 'react'
import { saveNotificationSettings } from '@/lib/notification/settingsClient'

type Importance = 'ALL' | 'CRITICAL_ONLY'

export default function NotificationSettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(true)
  const [importance, setImportance] = useState<Importance>('ALL')
  const [quietFrom, setQuietFrom] = useState(0)
  const [quietTo, setQuietTo] = useState(0)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (saving) return
    setSaving(true)

    await saveNotificationSettings({
      pushEnabled,
      importance,
      quietHours:
        quietFrom === quietTo
          ? undefined
          : { from: quietFrom, to: quietTo },
    })

    setSaving(false)
    alert('저장 완료')
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-extrabold">알림 설정</h1>

      {/* Push */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={pushEnabled}
          onChange={e => setPushEnabled(e.target.checked)}
        />
        Push 알림
      </label>

      {/* Importance */}
      <div>
        <p className="font-medium">중요도</p>
        <select
          className="border px-2 py-1"
          value={importance}
          onChange={e => setImportance(e.target.value as Importance)}
        >
          <option value="ALL">전체</option>
          <option value="CRITICAL_ONLY">중요만</option>
        </select>
      </div>

      {/* Quiet Hours */}
      <div>
        <p className="font-medium">방해금지 시간 (0~23)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={23}
            value={quietFrom}
            onChange={e => setQuietFrom(+e.target.value)}
            className="w-16 border px-1"
          />
          <span>~</span>
          <input
            type="number"
            min={0}
            max={23}
            value={quietTo}
            onChange={e => setQuietTo(+e.target.value)}
            className="w-16 border px-1"
          />
        </div>
        <p className="text-xs text-gray-500">
          from === to 이면 비활성화
        </p>
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {saving ? '저장 중...' : '저장'}
      </button>
    </div>
  )
}
