'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function InsightSectionAccordion({
  title,
  children,
  defaultOpen = false,
}: Props) {

  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900/40 overflow-hidden">

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-white">
          {title}
        </span>

        <ChevronDown
          className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`
          grid transition-all duration-300 ease-in-out
          ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
        `}
      >
        <div className="overflow-hidden">

          {open && (
            <div className="px-4 pb-4">
              {children}
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
