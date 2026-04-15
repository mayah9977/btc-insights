//app/[locale]/alerts/components/CreateAlertButton.tsx
'use client'

import { useState } from 'react'
import CreateAlertModal from './CreateAlertModal'

export default function CreateAlertButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* 모바일: FAB (카드 UI + BottomTab 모두 회피) */}
      <button
        onClick={() => setOpen(true)}
        className="
          fixed bottom-[110px] right-4 z-50
          flex items-center justify-center
          w-14 h-14 rounded-full
          bg-yellow-500 text-black text-xl font-bold
          shadow-xl hover:bg-yellow-400
          md:hidden
        "
      >
        +
      </button>

      {/* 데스크탑: 우측 상단 (header 아래) */}
      <button
        onClick={() => setOpen(true)}
        className="
          hidden md:block
          fixed top-[70px] right-6 z-50
          px-4 py-2 rounded-md
          bg-yellow-500 text-black font-bold
          hover:bg-yellow-400
        "
      >
        + 새 알림 생성
      </button>

      {open && <CreateAlertModal onClose={() => setOpen(false)} />}
    </>
  )
}
