'use client'

import { useState } from 'react'
import CreateAlertModal from './CreateAlertModal'

export default function CreateAlertButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-md bg-yellow-500 text-black font-bold hover:bg-yellow-400"
      >
        + 새 알림 생성
      </button>

      {open && <CreateAlertModal onClose={() => setOpen(false)} />}
    </>
  )
}
