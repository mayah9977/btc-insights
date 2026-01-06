'use client'

import { useEffect } from 'react'
import AlertForm from './AlertForm'

type Props = {
  onClose: () => void
  onSaved: () => void
}

export default function AlertCreateModal({ onClose, onSaved }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-[#0f1424] border border-white/15 p-8">
        <AlertForm
          onSubmit={async data => {
            await fetch('/api/alerts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            onSaved()
            onClose()
          }}
        />
      </div>
    </div>
  )
}
