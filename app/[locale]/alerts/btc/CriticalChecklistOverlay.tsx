'use client'

import clsx from 'clsx'
import type { ChecklistKey } from './useCriticalChecklist'

type Props = {
  checks: Record<ChecklistKey, boolean>
  toggle: (k: ChecklistKey) => void
  unlock: () => void
}

export default function CriticalChecklistOverlay({
  checks,
  toggle,
  unlock,
}: Props) {
  const allChecked = Object.values(checks).every(Boolean)

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90">
      <div className="w-[90%] max-w-md rounded-3xl border border-red-500/40 bg-[#0b0f1a] p-6">
        <h1 className="text-xl font-black text-red-400">
          CRITICAL CHECKLIST
        </h1>

        <div className="mt-4 space-y-3">
          {(Object.keys(checks) as ChecklistKey[]).map(key => {
            const value = checks[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={clsx(
                  'flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition',
                  value
                    ? 'bg-emerald-600/30 text-emerald-300'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700',
                )}
              >
                {key.toUpperCase()}
                {value && <span>✔</span>}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={unlock}
          disabled={!allChecked}
          className={clsx(
            'mt-6 h-12 w-full rounded-xl font-extrabold transition',
            allChecked
              ? 'bg-red-500 text-black hover:bg-red-400'
              : 'bg-zinc-700 text-zinc-400 cursor-not-allowed',
          )}
        >
          위험 인지 완료
        </button>
      </div>
    </div>
  )
}
