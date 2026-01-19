'use client'

import { Lock } from 'lucide-react'

// (선택) Rendering 상태를 관리하는 훅이 있다면 import
// import { useRealtimeStatus } from '@/lib/realtime/useRealtimeStatus'

export default function LockedRiskInfo() {
  // (선택) 실제 사용 중인 경우에만 활성화
  // const { setRendering } = useRealtimeStatus()

  const handleUpgradeClick = () => {
    // ✅ Dev 모드에서만 Rendering UI 정리 (보조 안전장치)
    if (process.env.NODE_ENV === 'development') {
      try {
        // setRendering?.(false)
      } catch {
        // noop: dev-only safety
      }
    }

    // ✅ Hard Navigation (World 이동)
    window.location.href = '/ko/account/upgrade'
  }

  return (
    <div
      className="
        pointer-events-auto   /* ✅ 클릭 강제 활성화 */
        relative z-50         /* ✅ 상위 오버레이 위로 */
        rounded-2xl
        border border-vipBorder
        bg-black/40
        p-6
        space-y-4
      "
    >
      {/* Header */}
      <div className="flex items-center gap-2 text-red-400">
        <Lock size={16} />
        <span className="text-xs tracking-widest uppercase">
          High-Risk Classified
        </span>
      </div>

      {/* Main Message */}
      <div className="text-lg font-semibold text-white">
        이 정보는 공개되지 않습니다
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-400 leading-relaxed">
        현재 시장은 고위험 시나리오로 분류되었습니다.
        <br />
        잘못된 해석으로 인한 손실을 방지하기 위해
        상세 판단은 제한됩니다.
      </p>

      {/* Footnote */}
      <p className="text-xs text-zinc-500">
        * 보호 목적의 제한입니다
      </p>

      {/* 👉 VIP Upgrade (HARD NAVIGATION) */}
      <button
        type="button"
        onClick={handleUpgradeClick}
        className="
          pointer-events-auto   /* ✅ 버튼 자체도 안전장치 */
          mt-2
          text-sm
          font-semibold
          text-zinc-200
          hover:text-white
          underline
          underline-offset-4
          transition-colors
        "
      >
        VIP 업그레이드 보기 →
      </button>
    </div>
  )
}
