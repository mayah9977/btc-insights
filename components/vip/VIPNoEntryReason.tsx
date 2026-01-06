import { generateRiskSentence } from '@/lib/vip/riskSentence'
import type { RiskLevel } from '@/lib/vip/riskEngine'

type Props = {
  riskLevel: RiskLevel
  reasons?: string[]
}

export default function VIPNoEntryReason({
  riskLevel,
  reasons = [],
}: Props) {
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
