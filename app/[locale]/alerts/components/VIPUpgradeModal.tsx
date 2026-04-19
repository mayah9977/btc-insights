'use client'

import { useRouter } from 'next/navigation' // ✅ added

export default function VIPUpgradeModal({
  onClose,
}: {
  onClose: () => void
}) {
  const router = useRouter() // ✅ added

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#0c1224] p-6 text-center border border-white/10">
        <h2 className="text-lg font-extrabold text-yellow-300 mb-2">
          VIP 전용 기능
        </h2>

        <p className="text-sm text-white/70 mb-6">
          VIP로 업그레이드하면 모든 보조지표 알림을 사용할 수 있습니다
        </p>

        <button
          onClick={() => {
            router.push('/ko/casino/vip') // ✅ modified
          }}
          className="w-full rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 py-3 text-sm font-bold text-black hover:opacity-90 active:scale-95 transition"
        >
          VIP 업그레이드
        </button>

        <button
          onClick={onClose}
          className="mt-3 w-full text-xs text-white/40 hover:text-white"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
