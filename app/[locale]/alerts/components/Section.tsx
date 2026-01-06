'use client'

import { memo, type ReactNode } from 'react'
import clsx from 'clsx'

type Props = {
  title: string
  desc?: string
  children: ReactNode
  emptyText?: string
  isEmpty?: boolean
  tone?: 'normal' | 'dim' | 'faded'
}

function Section({
  title,
  desc,
  children,
  emptyText,
  isEmpty,
  tone = 'normal',
}: Props) {
  const toneClass =
    tone === 'faded'
      ? 'bg-black/20 border-white/5 opacity-70'
      : tone === 'dim'
      ? 'bg-vipCard/70 border-white/10'
      : 'bg-vipCard border-vipBorder'

  return (
    <section className="space-y-6">
      <div>
        <div className="text-sm uppercase tracking-widest text-slate-400">
          {title}
        </div>
        {desc && (
          <div className="text-xs text-slate-500 mt-1">{desc}</div>
        )}
      </div>

      <div
        className={clsx(
          toneClass,
          'rounded-2xl divide-y divide-white/5',
        )}
      >
        {isEmpty && emptyText ? (
          <div className="py-14 text-center text-sm text-slate-500">
            {emptyText}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

export default memo(Section)
