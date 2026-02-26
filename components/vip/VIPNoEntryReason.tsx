'use client'

import { useLiveRiskState } from '@/lib/realtime/liveRiskState'
import { generateRiskSentence } from '@/lib/vip/riskSentence'
import type { RiskLevel } from '@/lib/vip/riskTypes'

type Props = {
  reasons?: string[]
}

export default function VIPNoEntryReason({
  reasons = [],
}: Props) {
  // 🔥 내부에서 실시간 리스크 구독
  const live = useLiveRiskState(s => s.state)
  const riskLevel: RiskLevel = live?.level ?? 'LOW'

  if (riskLevel === 'LOW') return null

  return (
    <div className="bg-vipCard border border-vipDanger rounded-2xl p-5 space-y-3">
      <div className="text-sm font-semibold text-vipDanger">
        Why you should not enter now
      </div>

      <div className="text-white">
        {generateRiskSentence(riskLevel)}
      </div>

      {reasons.length > 0 && (
        <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
