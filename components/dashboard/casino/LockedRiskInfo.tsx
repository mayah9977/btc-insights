'use client'

import { Lock } from 'lucide-react'

export default function LockedRiskInfo() {
  return (
    <div className="rounded-2xl border border-vipBorder bg-black/40 p-6 space-y-3">
      <div className="flex items-center gap-2 text-red-400">
        <Lock size={16} />
        <span className="text-xs tracking-widest uppercase">
          High-Risk Classified
        </span>
      </div>

      <div className="text-lg font-semibold text-white">
        이 정보는 공개되지 않습니다
      </div>

      <p className="text-sm text-zinc-400 leading-relaxed">
        현재 시장은 고위험 시나리오로 분류되었습니다.
        <br />
        잘못된 해석으로 인한 손실을 방지하기 위해
        상세 판단은 제한됩니다.
      </p>

      <p className="text-xs text-zinc-500">
        * 보호 목적의 제한입니다
      </p>
    </div>
  )
}
