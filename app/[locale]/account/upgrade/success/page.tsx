'use client'

import { useEffect } from 'react'

export default function UpgradeSuccessPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = '/ko/casino'
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-white">
        VIP 업그레이드 완료 🎉
      </h1>

      <p className="mt-3 text-neutral-400">
        실시간 분석 세계로 이동합니다.
      </p>

      <button
        onClick={() => (window.location.href = '/ko/casino')}
        className="mt-6 px-6 py-3 rounded-xl bg-green-500 text-black font-semibold hover:bg-green-400 transition"
      >
        지금 이동
      </button>
    </div>
  )
}
