'use client'

import type { RepeatMode } from '@/lib/alerts/alertStore.client'

export default function AlertRepeatSelect({
  value,
  cooldownMs,
  onChange,
  onCooldownChange,
}: {
  value: RepeatMode
  cooldownMs: number
  onChange: (v: RepeatMode) => void
  onCooldownChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">알림 주기</div>

      <select
        value={value}
        onChange={e => onChange(e.target.value as RepeatMode)}
        className="w-full border rounded px-3 py-2"
      >
        <option value="ONCE">1회</option>
        <option value="REPEAT">반복</option>
      </select>

      {value === 'REPEAT' && (
        <input
          type="number"
          value={cooldownMs}
          onChange={e => onCooldownChange(Number(e.target.value))}
          placeholder="쿨타임 (ms)"
          className="w-full border rounded px-3 py-2"
        />
      )}
    </div>
  )
}
