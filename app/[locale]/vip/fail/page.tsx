// app/[locale]/vip/fail/page.tsx

'use client'

import { useRouter } from 'next/navigation'

export default function FailPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white">
      <h1 className="text-2xl font-bold">결제 실패</h1>
      <p className="mt-2 text-slate-400">
        결제가 정상적으로 처리되지 않았습니다.
      </p>

      <button
        onClick={() => router.push('/ko/vip/upgrade')}
        className="mt-6 px-6 py-3 bg-emerald-500 text-black rounded-xl"
      >
        다시 시도
      </button>
    </div>
  )
}
