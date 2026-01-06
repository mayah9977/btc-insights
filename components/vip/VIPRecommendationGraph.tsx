'use client'

type Reason = {
  label: string
  weight: number
  color: string
}

const reasons: Reason[] = [
  { label: 'Liquidity', weight: 40, color: 'bg-emerald-400' },
  { label: 'Fee Efficiency', weight: 25, color: 'bg-sky-400' },
  { label: 'Execution Speed', weight: 20, color: 'bg-yellow-400' },
  { label: 'Risk Stability', weight: 15, color: 'bg-red-400' },
]

export default function VIPRecommendationGraph() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">
        Recommendation Weight
      </h3>

      {reasons.map((r) => (
        <div key={r.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">{r.label}</span>
            <span className="text-slate-400">{r.weight}%</span>
          </div>
          <div className="w-full h-2 rounded bg-white/10 overflow-hidden">
            <div
              className={`${r.color} h-full`}
              style={{ width: `${r.weight}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
