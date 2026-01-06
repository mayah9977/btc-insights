'use client'

import clsx from 'clsx'

type Status = 'SAFE' | 'RISK'

type Props = {
  status: Status
}

export default function AlertStatusBadge({ status }: Props) {
  const isSafe = status === 'SAFE'

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-extrabold',
        isSafe
          ? 'bg-emerald-500/15 text-emerald-600 animate-glow'
          : 'bg-rose-500/15 text-rose-600 animate-pulse',
      )}
    >
      <span>{isSafe ? '🟢' : '🔴'}</span>
      <span>{isSafe ? 'SAFE' : 'RISK'}</span>
    </div>
  )
}
