'use client'

import type { AlertCondition } from '@/lib/alerts/alertStore.client'

const OPTIONS: { value: AlertCondition; label: string }[] = [
  {
    value: 'ABOVE',
    label: '📈 설정가 이상 상승',
  },
  {
    value: 'BELOW',
    label: '📉 설정가 이하 하락',
  },
  {
    value: 'PERCENT_UP',
    label: '🚀 현재가 대비 % 이상 상승',
  },
  {
    value: 'PERCENT_DOWN',
    label: '🔻 현재가 대비 % 이상 하락',
  },
]

export default function AlertConditionSelect({
  value,
  onChange,
}: {
  value: AlertCondition
  onChange: (v: AlertCondition) => void
}) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-1">알림 조건</div>

      <select
        value={value}
        onChange={e => onChange(e.target.value as AlertCondition)}
        className="
          w-full rounded-xl bg-[#0b0e13]
          border border-white/15 px-4 py-3
          text-white
          focus:outline-none focus:border-indigo-500
          focus:ring-2 focus:ring-indigo-500/30
          transition
        "
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
